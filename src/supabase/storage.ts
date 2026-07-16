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
export const uploadProductImage = async (file: File, customFileName?: string) => {
  let fileName = `${Date.now()}.jpg`;

  if (customFileName) {
    // 1. Nettoie le nom : supprime les accents, remplace les espaces par des tirets, enlève le .jpg existant si présent
    const cleanName = customFileName
      .normalize("NFD")                      // Sépare les lettres de leurs accents
      .replace(/[\u0300-\u036f]/g, "")       // Supprime les accents
      .replace(/\.[^/.]+$/, "")              // Enlève l'extension d'origine si incluse
      .replace(/[^a-zA-Z0-9-_]/g, "-")       // Remplace tout caractère non-alphanumérique (dont espaces) par un tiret
      .replace(/-+/g, "-")                   // Évite les doubles tirets successifs
      .toLowerCase();                        // Force les minuscules pour la cohérence URL

    fileName = `${cleanName}.jpg`;
  }

  const filePath = `products/${fileName}`;

  const options = {
    maxSizeMB: 0.5,         
    maxWidthOrHeight: 1024, 
    useWebWorker: true,     
    fileType: 'image/jpeg'  
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // 2. Création d'un nouveau fichier pour garantir le bon type MIME et le bon nom dans l'en-tête de la requête
    const finalFile = new File([compressedFile], fileName, { type: 'image/jpeg' });

    const { error: uploadError } = await supabase.storage
      .from("shop_images")
      .upload(filePath, finalFile, {
        cacheControl: "31536000", 
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("shop_images").getPublicUrl(filePath);
    return data.publicUrl;

  } catch (error) {
    console.error("Erreur lors du traitement de l'image :", error);
    throw error;
  }
};

