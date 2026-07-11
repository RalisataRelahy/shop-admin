import { supabase } from "./config";
import imageCompression from 'browser-image-compression';

export const uploadProductImage = async (file: File, customFileName?: string) => {
  // 1. Force l'extension en .jpg puisque l'option 'fileType' va convertir l'image en JPEG
  const fileName = customFileName ? `${customFileName}.jpg` : `${Date.now()}.jpg`;
  const filePath = `products/${fileName}`;

  const options = {
    maxSizeMB: 0.5,         // 500 Ko maximum
    maxWidthOrHeight: 1024, // Redimensionnement automatique à 1024px max
    useWebWorker: true,     // Thread séparé pour les performances de l'UI
    fileType: 'image/jpeg'  // Conversion forcée en JPEG
  };

  try {
    // 2. Exécution de la compression
    const compressedFile = await imageCompression(file, options);
    
    // 3. Téléversement du fichier compressé vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("shop_images")
      .upload(filePath, compressedFile, {
        cacheControl: "31536000", // Cache d'un an (idéal pour des images de produits fixes)
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 4. Récupération de l'URL publique
    const { data } = supabase.storage.from("shop_images").getPublicUrl(filePath);
    return data.publicUrl;

  } catch (error) {
    console.error("Erreur lors du traitement de l'image :", error);
    throw error;
  }
};
