import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Multer: store file in memory so we can stream to Cloudinary
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  },
}).single('file');

/**
 * POST /api/upload
 * Accepts multipart/form-data with a `file` field.
 * Optionally accepts a `folder` field (defaults to 'localskillhub').
 * Returns { status, data: { url, publicId, width, height } }
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      console.error('Upload error: No file provided');
      return res.status(400).json({ status: 'error', message: 'No file provided' });
    }

    console.log('Upload request received:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const folder = (req.body && req.body.folder) ? req.body.folder : 'localskillhub';

    // Convert buffer → base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    console.log('Upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (err) {
    console.error('Upload controller error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      response: err.http_code,
    });
    return res.status(500).json({ 
      status: 'error', 
      message: err.message || 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
