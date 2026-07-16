import { supabase } from "./config";
import imageCompression from 'browser-image-compression';

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

