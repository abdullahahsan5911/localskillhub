import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';
import {
  getFreelancerAnalytics,
  getClientAnalytics,
  getPlatformStats,
  getLocalLeaderboard
} from '../controllers/analytics.js';

const router = express.Router();

router.use(protect);

// Freelancer & Client Dashboards (shorter cache for more up-to-date data)
router.get('/freelancer', authorize('freelancer', 'both'), cacheMiddleware(120), getFreelancerAnalytics);
router.get('/client', authorize('client', 'both'), cacheMiddleware(120), getClientAnalytics);

// Leaderboards & Stats (can cache longer)
router.get('/leaderboard/local', cacheMiddleware(300), getLocalLeaderboard);
router.get('/platform', cacheMiddleware(300), getPlatformStats);

export default router;
