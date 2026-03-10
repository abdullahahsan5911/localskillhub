import express from 'express';
import { protect } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful
} from '../controllers/reviews.js';

const router = express.Router();

// Public routes (with caching - 5 minutes)
router.get('/', cacheMiddleware(300), getReviews);
router.get('/:id', cacheMiddleware(300), getReview);

// Protected routes
router.use(protect);

router.post('/', invalidateCache(['cache:*/api/reviews*', 'cache:*/api/freelancers*']), createReview);
router.put('/:id', invalidateCache(['cache:*/api/reviews*']), updateReview);
router.delete('/:id', invalidateCache(['cache:*/api/reviews*']), deleteReview);
router.post('/:id/respond', invalidateCache(['cache:*/api/reviews*']), respondToReview);
router.post('/:id/helpful', invalidateCache(['cache:*/api/reviews*']), markHelpful);

export default router;
