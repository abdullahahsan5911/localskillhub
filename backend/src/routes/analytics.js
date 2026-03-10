import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';
import {
  getFreelancerAnalytics,
  getClientAnalytics,
  getPlatformStats
} from '../controllers/analytics.js';

const router = express.Router();

router.use(protect);

// Cache analytics for 2 minutes (shorter cache for more up-to-date data)
router.get('/freelancer', authorize('freelancer', 'both'), cacheMiddleware(120), getFreelancerAnalytics);
router.get('/client', authorize('client', 'both'), cacheMiddleware(120), getClientAnalytics);
router.get('/platform', cacheMiddleware(120), getPlatformStats);

export default router;
