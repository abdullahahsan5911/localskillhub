import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  completeOnboarding,
  skipOnboarding,
  followUser,
  unfollowUser,
  addJobBookmark,
  removeJobBookmark,
  getFollowStats,
  getOnlineUsers,
  getUserPresence,
  updateUserPresence,
  getReputation,
  checkGithubAccount,
  verifyGithub,
  verifyGithubSso,
  submitVerifiedBadge,
  getVerificationStatus
} from '../controllers/users.js';

const router = express.Router();

// ✅ PUBLIC - Anyone can view public profiles
router.get('/:id', getUser);
router.get('/:id/reputation', getReputation);

// 🔒 ADMIN ONLY - Prevent data scraping
router.get('/', protect, authorize('admin'), getUsers);

// 🔒 PRIVATE - Require authentication for own profile operations
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

// Verification endpoints (must be PUBLIC - before protect middleware)
router.post('/verify/github/check', checkGithubAccount);

// 🔒 PRIVATE - Onboarding endpoints
router.use(protect);
router.post('/onboarding/complete', completeOnboarding);
router.post('/onboarding/skip', skipOnboarding);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/follow/stats', getFollowStats);

// Bookmarks for current user
router.post('/me/bookmarks', addJobBookmark);
router.delete('/me/bookmarks/:jobId', removeJobBookmark);

// Presence & Online Status endpoints
router.get('/presence/online', getOnlineUsers);
router.get('/:id/presence', getUserPresence);
router.post('/presence/update', updateUserPresence);

// Verification endpoints (requires auth)
router.post('/verify/github', verifyGithub);
router.post('/verify/github/sso', verifyGithubSso);

// Verified Badge application endpoints
router.get('/me/verification-status', getVerificationStatus);
router.post('/verification/submit-verified-badge', submitVerifiedBadge);

export default router;
