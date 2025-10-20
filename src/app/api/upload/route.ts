

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
    
    const file = imageFile || audioFile;
    const isAudio = !!audioFile;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Fayl topilmadi.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: isAudio ? 'indizayn_audio' : 'indizayn_uploads',
                resource_type: isAudio ? "video" : "image", // Cloudinary treats audio as video
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
