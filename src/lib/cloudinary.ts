import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Generate upload signature for client-side uploads
 * @param folder - The folder path in Cloudinary
 * @param publicId - Optional public ID for the resource
 * @returns Upload signature object
 */
export function generateUploadSignature(folder: string, publicId?: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params = {
    folder,
    timestamp,
    ...(publicId && { public_id: publicId })
  };

  // This would typically use the cloudinary SDK to generate signature
  // For now, return a placeholder structure
  return {
    signature: 'placeholder_signature',
    timestamp,
    folder,
    ...(publicId && { public_id: publicId })
  };
}

/**
 * Get Cloudinary upload URL for a specific folder
 * @param folder - The folder path in Cloudinary
 * @returns Upload URL
 */
export function getUploadUrl(folder: string): string {
  return `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
}

/**
 * Delete a resource from Cloudinary
 * @param publicId - The public ID of the resource to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteResource(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting Cloudinary resource:', error);
    throw error;
  }
}
