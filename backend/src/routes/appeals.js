import express from 'express';
import { protect, protectAllowBanned, authorize } from '../middleware/auth.js';
import {
  submitBanAppeal,
  getBanAppealStatus,
  getAllBanAppeals,
  reviewBanAppeal,
  reopenBanAppeal
} from '../controllers/appeals.js';

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════
// BAN APPEALS - Banned users can appeal their ban
// ═════════════════════════════════════════════════════════════════════

// Allow banned users to submit appeals and check status (use protectAllowBanned to skip ban check)
router.post('/ban', protectAllowBanned, submitBanAppeal);
router.get('/ban/status', protectAllowBanned, getBanAppealStatus);

// ═════════════════════════════════════════════════════════════════════
// ADMIN ONLY - Manage appeals
// ═════════════════════════════════════════════════════════════════════

router.use(protect, authorize('admin'));

router.get('/ban', getAllBanAppeals);
router.post('/ban/:appealId/review', reviewBanAppeal);
router.post('/ban/:appealId/reopen', reopenBanAppeal);

export default router;
