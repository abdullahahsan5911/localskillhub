import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  getLeaderboard,
  getBadges,
  getEvents,
  createEvent,
  joinEvent,
  getUserRank
} from '../controllers/community.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', optionalAuth, getLeaderboard);
router.get('/badges', getBadges);
router.get('/events', optionalAuth, getEvents);

// Protected routes
router.use(protect);

router.post('/events', createEvent);
router.post('/events/:id/join', joinEvent);
router.get('/rank', getUserRank);

export default router;
