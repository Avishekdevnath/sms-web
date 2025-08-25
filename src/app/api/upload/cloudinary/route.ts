import { NextRequest } from "next/server";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 Cloudinary upload request started');
    
    // Check authentication
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ No file provided');
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size);
      return Response.json({ error: "File too large" }, { status: 400 });
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Missing Cloudinary environment variables');
      return Response.json({ error: "Cloudinary configuration missing" }, { status: 500 });
    }

    console.log('✅ Environment variables found');

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    console.log('📤 Uploading to Cloudinary...');

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    try {
      // Upload using Cloudinary SDK
      const cloudinaryData = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataURI,
          {
            folder: 'student-profiles',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary SDK error:', error);
              reject(error);
            } else {
              console.log('✅ Upload successful:', {
                publicId: result?.public_id,
                url: result?.secure_url,
                size: result?.bytes
              });
              resolve(result);
            }
          }
        );
      });
          return Response.json({
        success: true,
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        format: cloudinaryData.format,
        size: cloudinaryData.bytes
      });

    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return Response.json({ 
        error: "Upload failed", 
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    return Response.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 