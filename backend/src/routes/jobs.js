import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { checkBannedOrSuspended } from '../middleware/checkBan.js';
import { checkRiskForJobPosting } from '../middleware/checkRiskLevel.js';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  getNearbyJobs,
  inviteFreelancers,
  getMyJobs
} from '../controllers/jobs.js';

const router = express.Router();

// Public/Optional Auth routes (with caching - 5 minutes)
router.get('/', optionalAuth, cacheMiddleware(300), getJobs);
router.get('/search', optionalAuth, cacheMiddleware(300), searchJobs);
router.get('/nearby', optionalAuth, cacheMiddleware(300), getNearbyJobs);

// Protected: must come before /:id to avoid route shadowing
router.get('/my', protect, authorize('client'), getMyJobs);

router.get('/:id', optionalAuth, cacheMiddleware(300), getJob);

// Protected routes
router.use(protect);

router.post('/', authorize('client'), checkBannedOrSuspended, checkRiskForJobPosting, invalidateCache(['cache:*/api/jobs*']), createJob);
router.put('/:id', authorize('client'), checkBannedOrSuspended, invalidateCache(['cache:*/api/jobs*']), updateJob);
router.delete('/:id', authorize('client'), checkBannedOrSuspended, invalidateCache(['cache:*/api/jobs*']), deleteJob);
router.post('/:id/invite', authorize('client'), checkBannedOrSuspended, inviteFreelancers);

export default router;
