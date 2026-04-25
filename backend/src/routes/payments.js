import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createConnectOnboardingLink,
  refreshConnectOnboardingLink,
  getPayoutStatus,
  withdrawPayouts,
} from '../controllers/payments.js';

const router = express.Router();

// All routes require an authenticated freelancer
router.use(protect, authorize('freelancer'));

router.post('/connect/onboard', createConnectOnboardingLink);
router.post('/connect/refresh', refreshConnectOnboardingLink);
router.get('/payout/status', getPayoutStatus);
router.post('/payout/withdraw', withdrawPayouts);

export default router;
