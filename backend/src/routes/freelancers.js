import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import {
  getFreelancers,
  getFreelancer,
  createFreelancerProfile,
  updateFreelancerProfile,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  addEndorsement,
  searchFreelancers
} from '../controllers/freelancers.js';

const router = express.Router();

// Public routes (with caching - 5 minutes)
router.get('/', cacheMiddleware(300), getFreelancers);
router.get('/search', cacheMiddleware(300), searchFreelancers);
router.get('/:id', cacheMiddleware(300), getFreelancer);

// Protected routes
router.use(protect);

router.post('/profile', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/freelancers*']), createFreelancerProfile);
router.put('/profile', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/freelancers*']), updateFreelancerProfile);

router.post('/portfolio', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/freelancers*']), addPortfolioItem);
router.put('/portfolio/:itemId', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/freelancers*']), updatePortfolioItem);
router.delete('/portfolio/:itemId', authorize('freelancer', 'both'), invalidateCache(['cache:*/api/freelancers*']), deletePortfolioItem);

router.post('/:id/endorse', invalidateCache(['cache:*/api/freelancers*']), addEndorsement);

export default router;
