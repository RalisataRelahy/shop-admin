import { supabase } from "./config";
import imageCompression from 'browser-image-compression';

/**
 * Recadre l'image d'origine pour en extraire le centre sous forme de rectangle horizontal
 * avec une largeur stricte de 320px et une hauteur de 180px (ratio 16:9).
 */
export const cropAndResizeToHorizontal = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Impossible de créer le contexte 2D du Canvas"));
        return;
      }

      // Dimensions cibles strictes pour votre rectangle horizontal
      const targetWidth = 320;
      const targetHeight = 180; // Ratio 16:9 (Modifiez à 240 pour du 4:3 si besoin)

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calcul des coordonnées pour centrer et découper (Crop) sans déformer
      const sourceRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (sourceRatio > targetRatio) {
        // L'image d'origine est trop large (très panoramique) -> on coupe les côtés
        sourceWidth = img.height * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // L'image d'origine est carrée ou verticale -> on coupe le haut et le bas
        sourceHeight = img.width / targetRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Dessine la partie découpée et centrée dans le canvas de 320x180
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight, // Zone source (découpe)
        0, 0, targetWidth, targetHeight             // Zone destination (320x180)
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Le Canvas n'a pas pu générer de Blob"));
            return;
          }
          const croppedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        0.85 // Qualité de compression initiale
      );
    };

    img.onerror = (err) => reject(err);
  });
};

/**
 * Traite, recadre, compresse et uploade l'image d'un produit vers Supabase.
 */
export const uploadProductImage = async (file: File, customFileName?: string): Promise<string> => {
  let fileName = `${Date.now()}.jpg`;

  if (customFileName) {
    const cleanName = customFileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    fileName = `${cleanName}.jpg`;
  }

  const filePath = `products/${fileName}`;

  try {
    // 1. Force le recadrage au format rectangle horizontal (320x180)
    const croppedFile = await cropAndResizeToHorizontal(file);

    // 2. Finalise la compression du fichier final pour optimiser le poids
    const options = {
      maxSizeMB: 0.1, // Idéal pour du 320x180 (l'image sera ultra légère)
      useWebWorker: true,
      fileType: 'image/jpeg'
    };
    const compressedBlob = await imageCompression(croppedFile, options);
    const finalFile = new File([compressedBlob], fileName, { type: 'image/jpeg' });

    // 3. Importation sur Supabase
    const { error: uploadError } = await supabase.storage
      .from("shop_images")
      .upload(filePath, finalFile, {
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 4. Récupération de l'URL publique
    const { data } = supabase.storage.from("shop_images").getPublicUrl(filePath);
    return data.publicUrl;

  } catch (error) {
    console.error("Erreur lors du traitement ou de l'upload de l'image :", error);
    throw error;
  }
};
