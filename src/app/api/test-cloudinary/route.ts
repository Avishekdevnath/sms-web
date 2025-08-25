import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const config = {
      cloudName: cloudName ? '✅ Set' : '❌ Missing',
      apiKey: apiKey ? '✅ Set' : '❌ Missing',
      apiSecret: apiSecret ? '✅ Set' : '❌ Missing',
      allSet: !!(cloudName && apiKey && apiSecret)
    };

    return Response.json({
      success: true,
      config,
      message: config.allSet 
        ? 'Cloudinary configuration is ready!' 
        : 'Please configure Cloudinary environment variables'
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: "Failed to check configuration" 
    }, { status: 500 });
  }
} 