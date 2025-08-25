# 📸 Cloudinary Setup Guide

## 🎯 Overview
This guide will help you set up Cloudinary for image uploads in the Student Management System.

## 🔧 Prerequisites
1. **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com)
2. **Node.js**: Ensure you have Node.js installed
3. **Environment Variables**: Ready to configure

## 📋 Step-by-Step Setup

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials
1. **Login to Cloudinary Dashboard**
2. **Copy your credentials**:
   - **Cloud Name**: Found in the dashboard URL or settings
   - **API Key**: Available in Account Details
   - **API Secret**: Available in Account Details

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important Notes:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is public and safe to expose
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are private and should never be exposed
- Make sure there are no spaces around the `=` sign
- Restart your development server after adding these variables

### 4. Create Upload Preset (Optional)
Since we're using server-side uploads with API credentials, you don't need to create an upload preset. The server will handle the upload directly using your API key and secret.

However, if you want to use client-side uploads in the future, you can create an upload preset:

1. **Go to Settings** → **Upload** in Cloudinary Dashboard
2. **Scroll to Upload Presets**
3. **Click "Add upload preset"**
4. **Configure the preset**:
   - **Preset name**: `sms_profile`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `student-profiles`
   - **Allowed formats**: `jpg, png, webp`
   - **Max file size**: `5MB`
   - **Note**: No size transformations - original dimensions preserved

### 5. Install Dependencies
```bash
# Install Cloudinary SDK for server-side uploads
npm install cloudinary

# Optional: Install react-dropzone for enhanced drag-and-drop
npm install react-dropzone
```

## 🎨 Features Included

### ✅ CloudinaryUpload Component
- **Drag & Drop**: Modern drag-and-drop interface
- **File Validation**: Type and size validation
- **Progress Indicator**: Real-time upload progress
- **Image Preview**: Preview before upload
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on all devices

### ✅ Server-Side API
- **Secure Uploads**: Server-side authentication using Cloudinary SDK
- **File Validation**: Type and size checks
- **Simple Upload**: No transformations - uploads as is
- **Error Handling**: Comprehensive error responses
- **Security**: Authentication required
- **Reliability**: Uses official Cloudinary SDK

### ✅ Integration Points
- **Profile Completion**: Student profile picture upload
- **Future Use**: Can be extended for other image uploads

## 🔒 Security Features

### Client-Side Security
- File type validation
- File size limits
- Preview before upload
- Error handling

### Server-Side Security
- Authentication required
- File validation
- Secure API endpoints
- Rate limiting (Cloudinary handles this)

## 📱 Usage Examples

### Basic Usage
```tsx
import CloudinaryUpload from '@/components/CloudinaryUpload';

<CloudinaryUpload
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
  onUploadError={(error) => console.error('Error:', error)}
  placeholder="Upload your image"
/>
```

### Advanced Usage
```tsx
<CloudinaryUpload
  onUploadSuccess={(url) => setImageUrl(url)}
  onUploadError={(error) => setError(error)}
  maxSize={10 * 1024 * 1024} // 10MB
  acceptedTypes={['image/jpeg', 'image/png']}
  placeholder="Upload profile picture"
/>
```

## 🎯 Image Transformations

### Automatic Transformations
- **Size**: 500x500 pixels
- **Crop**: Fill with face detection
- **Format**: Auto-optimized (WebP when supported)
- **Quality**: Auto-optimized

### Custom Transformations
Currently, the upload is configured to upload images as-is without any transformations. If you want to add transformations later, you can modify `/api/upload/cloudinary/route.ts`:

```javascript
// Current (no transformations):
body: JSON.stringify({
  file: dataURI,
  folder: 'student-profiles'
  // No transformations - upload as is
})

// With transformations (example):
body: JSON.stringify({
  file: dataURI,
  folder: 'student-profiles',
  transformation: 'w_500,h_500,c_fill,q_auto'
})
```

## 🚀 Testing

### 1. Test Upload
1. Start your development server
2. Go to profile completion page
3. Try uploading an image
4. Check if it appears in Cloudinary dashboard

### 2. Test Error Handling
1. Try uploading non-image files
2. Try uploading files larger than 5MB
3. Check error messages

### 3. Test Responsiveness
1. Test on mobile devices
2. Test drag-and-drop functionality
3. Test on different browsers

## 🔧 Troubleshooting

### Common Issues

#### 1. "Upload failed" Error
- Check Cloudinary credentials in `.env.local`
- Verify environment variables are loaded (restart dev server)
- Check network connection
- Test configuration at `/api/test-cloudinary-simple`

#### 2. "General Error" from Cloudinary
- Verify API key and secret are correct
- Check if cloud name is correct
- Ensure account has upload permissions
- Test with simple API call first

#### 3. Environment Variables Not Loading
- Restart development server after adding variables
- Check for typos in variable names
- Ensure no spaces around `=` sign
- Verify `.env.local` file is in project root

#### 2. "Invalid file type" Error
- Ensure file is JPG, PNG, or WebP
- Check file extension

#### 3. "File too large" Error
- Reduce file size (max 5MB)
- Compress image before upload

#### 4. Authentication Error
- Check if user is logged in
- Verify API route is working

### Debug Steps
1. **Check Console**: Look for error messages
2. **Check Network**: Monitor API calls
3. **Check Cloudinary Dashboard**: Verify uploads
4. **Check Environment Variables**: Ensure they're loaded

## 📊 Performance

### Optimizations
- **Automatic Format**: WebP when supported
- **Quality Optimization**: Auto-optimized quality
- **Original Dimensions**: Preserves image size for better quality
- **CDN**: Cloudinary's global CDN

### Monitoring
- **Upload Speed**: Monitor upload times
- **Success Rate**: Track successful uploads
- **Error Rate**: Monitor failed uploads
- **Storage Usage**: Monitor Cloudinary storage

## 🔄 Future Enhancements

### Potential Features
- **Multiple Image Upload**: For galleries
- **Image Cropping**: Client-side cropping
- **Filters**: Image filters and effects
- **Bulk Upload**: Multiple files at once
- **Progress Tracking**: Better progress indicators

### Integration Points
- **Student Profiles**: Profile pictures
- **Course Materials**: Course images
- **Announcements**: Announcement images
- **Assignments**: Assignment attachments

## 📞 Support

### Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [React Dropzone Documentation](https://react-dropzone.js.org/)
- [Next.js File Upload Guide](https://nextjs.org/docs/api-routes/api-middlewares)

### Contact
- **Cloudinary Support**: [support@cloudinary.com](mailto:support@cloudinary.com)
- **Project Issues**: Create issue in project repository

---

**Note**: Keep your Cloudinary credentials secure and never commit them to version control. 