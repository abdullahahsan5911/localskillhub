import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware, uploadFile } from '../controllers/upload.js';

const router = express.Router();

// POST /api/upload  — authenticated, rate-limited
router.post('/', protect, uploadLimiter, uploadMiddleware, uploadFile);

export default router;
