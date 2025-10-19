
'use server';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string; publicId?: string }> {
  const file = formData.get('image') as File;
  
  if (!file) {
    return { success: false, error: 'Rasm topilmadi.' };
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using upload_stream inside a Promise
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          tags: ['nextjs-server-actions-upload'],
          // You can add more upload options here, like transformations
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

    // On successful upload, return success response
    // revalidatePath was causing an error here. The client side handles refreshing.
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    // Catch any error during the process
    console.error('Cloudinary yuklashda xatolik:', error);
    // Return a structured error response
    return { 
      success: false, 
      error: error.message || "Rasm yuklashda noma'lum server xatoligi." 
    };
  }
}
