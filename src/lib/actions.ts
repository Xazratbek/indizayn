
'use server';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string; publicId?: string }> {
  const file = formData.get('image') as File;
  
  if (!file) {
    return { success: false, error: 'Rasm topilmadi.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Image}`;

    const result: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
      folder: 'indizayn_uploads', // Optional: organize uploads in a folder
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary yuklashda xatolik:', error);
    return { 
      success: false, 
      error: error.message || "Rasm yuklashda noma'lum server xatoligi." 
    };
  }
}
