import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload image to Cloudinary
 * @param {string} fileBuffer - Base64 string or file buffer
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadImage = async (fileBuffer, folder = 'localskillhub') => {
  try {
    const result = await cloudinary.uploader.upload(fileBuffer, {
      folder: folder,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Upload multiple images
 * @param {Array<string>} fileBuffers - Array of base64 strings or file buffers
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleImages = async (fileBuffers, folder = 'localskillhub') => {
  try {
    const uploadPromises = fileBuffers.map(buffer => uploadImage(buffer, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload images');
  }
};

export default cloudinary;
