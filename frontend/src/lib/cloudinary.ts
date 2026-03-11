// Cloudinary Upload Utility for Frontend

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/195735266331774/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'localskillhub';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload an image file to Cloudinary
 * @param file - The file to upload (from input type="file")
 * @returns Promise with upload result containing URL and metadata
 */
export const uploadToCloudinary = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'localskillhub');

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of files to upload
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: File[]
): Promise<UploadResult[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
};

/**
 * Convert base64 string to File object
 * @param base64 - Base64 encoded string
 * @param filename - Name for the file
 * @returns File object
 */
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

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns true if valid, throws error if invalid
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): boolean => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Image size must be less than ${maxSizeMB}MB`);
  }

  return true;
};

/**
 * Compress image before upload (optional)
 * @param file - Image file to compress
 * @param maxWidth - Maximum width (default: 1920)
 * @param quality - Image quality 0-1 (default: 0.8)
 * @returns Promise with compressed file
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
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

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
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
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  base64ToFile,
  validateImageFile,
  compressImage,
};
