import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  verifyPhone,
  verifyPhoneCode,
  verifyEmail,
  verifyId,
  verifySelfie,
  getSocialProof,
  addBadge
} from '../controllers/verification.js';

const router = express.Router();

router.use(protect);

router.post('/phone', verifyPhone);
router.post('/phone/verify', verifyPhoneCode);
router.post('/email', verifyEmail);
router.post('/id', verifyId);
router.post('/selfie', verifySelfie);
router.get('/social-proof', getSocialProof);
router.post('/badge', addBadge);

export default router;
