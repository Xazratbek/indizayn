'use server';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { revalidatePath } from 'next/cache';

cloudinary.config({
  cloud_name: 'studioproject',
  api_key: '534665423858783',
  api_secret: 'R-p_4mHmbpI1y725LeVvN2FGjGg'
});

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string; publicId?: string }> {
  const file = formData.get('image') as File;
  if (!file) {
    return { success: false, error: 'Rasm topilmadi.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          tags: ['nextjs-server-actions-upload-sneakers'],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (result) {
            return resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    revalidatePath('/account');
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary yuklashda xatolik:', error);
    return { success: false, error: error.message || "Rasm yuklashda noma'lum xatolik." };
  }
}
