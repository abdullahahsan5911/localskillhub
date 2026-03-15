import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import {
  getAssets,
  getAsset,
  getMyAssets,
  createAsset,
  downloadAsset,
  rateAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/assets.js';

const router = express.Router();

// Public / optional auth routes
router.get('/', optionalAuth, cacheMiddleware(300), getAssets);
router.get('/:id', optionalAuth, getAsset);

// Protected routes
router.use(protect);

router.get('/me/mine', authorize('freelancer', 'both'), getMyAssets);
router.post('/', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/assets*']), createAsset);
router.put('/:id', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/assets*']), updateAsset);
router.delete('/:id', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/assets*']), deleteAsset);
router.post('/:id/download', downloadAsset);
router.post('/:id/rate', rateAsset);

export default router;
