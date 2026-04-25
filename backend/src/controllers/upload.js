import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer memory storage
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedImages = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    const allowedDocs = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Archives (e.g. ZIP, RAR) handled as raw files in Cloudinary
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
    ];

    const allowed = [...allowedImages, ...allowedDocs];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only images (JPEG, PNG, GIF, WebP), documents (PDF, Word, Excel), and ZIP/RAR archives are allowed'
        )
      );
    }
  },
}).single('file');

/**
 * POST /api/upload
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 'error', message: 'No file provided' });
    }

    const folder = req.body?.folder || 'localskillhub';
    const isImage = req.file.mimetype.startsWith('image/');
    const isPdf = req.file.mimetype === 'application/pdf';

    const fileExtension = req.file.originalname.split('.').pop();
    const fileNameWithoutExt = req.file.originalname.split('.')[0];
    const sanitizedName = fileNameWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'localskillhub_unsigned';

    console.log('📤 Starting upload:', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadPreset,
      cloudName,
    });

    // Use unsigned upload to Cloudinary
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);
    formData.append('upload_preset', uploadPreset);
    // DO NOT override folder - let the preset handle it for unsigned uploads
    // formData.append('folder', folder);
    formData.append('public_id', `${Date.now()}_${sanitizedName}`);

    // Use correct resource_type: 'image' for images, 'raw' for documents
    const resourceType = isImage ? 'image' : 'raw';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    console.log('🌐 Cloudinary URL:', uploadUrl);
    console.log('📝 Form data keys:', Array.from(formData.keys()));

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('📊 Response status:', uploadResponse.status);
    console.log('📊 Response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    const uploadResult = await uploadResponse.json();

    console.log('📨 Cloudinary response:', {
      status: uploadResponse.status,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      error: uploadResult.error,
    });

    if (!uploadResponse.ok) {
      console.error('❌ Cloudinary error:', uploadResult.error);
      return res.status(400).json({
        status: 'error',
        message: `Cloudinary error: ${uploadResult.error?.message || 'Upload failed'}`,
        details: uploadResult.error,
      });
    }

    // The secure_url from Cloudinary IS the public URL
    // It's directly accessible without authentication
    const publicUrl = uploadResult.secure_url;

    console.log('✅ File uploaded successfully');
    console.log('🔗 Public URL (secure_url):', publicUrl);

    // Return a minimal, stable payload. The frontend is responsible for
    // deriving any "download" variants from this canonical URL.
    return res.status(200).json({
      status: 'success',
      data: {
        url: publicUrl,
        publicId: uploadResult.public_id,
        resourceType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileExtension,
      },
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Upload failed',
      error: err.toString(),
    });
  }
};