// Cloudinary Upload Utility for Frontend
// Images are sent to the backend (/api/upload) which then uploads to Cloudinary
// using server-side credentials. Direct client→Cloudinary uploads are disabled.

import api from './api';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export const validateImageFile = (file: File, maxSizeMB: number = 5): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Image size must be less than ${maxSizeMB}MB`);
  }
  return true;
};

/**
 * Upload an image file via the backend (backend → Cloudinary).
 */
export const uploadToCloudinary = async (file: File, folder?: string): Promise<UploadResult> => {
  validateImageFile(file);
  return api.uploadFile(file, folder);
};

export const uploadMultipleToCloudinary = async (files: File[], folder?: string): Promise<UploadResult[]> =>
  Promise.all(files.map((file) => uploadToCloudinary(file, folder)));

export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });

export default { uploadToCloudinary, uploadMultipleToCloudinary, base64ToFile, validateImageFile, compressImage };
