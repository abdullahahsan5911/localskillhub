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

// Freelancer & Client Dashboards – no cache so stats update immediately
router.get('/freelancer', authorize('freelancer'), getFreelancerAnalytics);
router.get('/client', authorize('client'), getClientAnalytics);

// Leaderboards & global stats can still be cached
router.get('/leaderboard/local', cacheMiddleware(300), getLocalLeaderboard);
router.get('/platform', cacheMiddleware(300), getPlatformStats);

export default router;
