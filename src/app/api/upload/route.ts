

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v2 as cloudinary } from 'cloudinary';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const videoFile = formData.get('video') as File | null;

    let file: File | null = null;
    let resource_type: 'image' | 'video' = 'image';
    let folder = 'indizayn_uploads';

    if (imageFile) {
        file = imageFile;
        resource_type = 'image';
        folder = 'indizayn_uploads';
    } else if (audioFile) {
        file = audioFile;
        resource_type = 'video'; // Cloudinary treats audio as video
        folder = 'indizayn_audio';
    } else if (videoFile) {
        file = videoFile;
        resource_type = 'video';
        folder = 'indizayn_video';
    }


    if (!file) {
      return NextResponse.json({ success: false, error: 'Fayl topilmadi.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: resource_type,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    });

  } catch (error: any) {
    console.error('Cloudinary API Route yuklashda xatolik:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Fayl yuklashda noma'lum server xatoligi." 
    }, { status: 500 });
  }
}
