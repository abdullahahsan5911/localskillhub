import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendEmailVerification,
  verifyEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  submitIDVerification,
  verifyBiometric,
  connectLinkedIn,
  connectGitHub,
  getVerificationStatus,
  getReputation,
  recalculateReputation
} from '../controllers/verificationController.js';

const router = express.Router();

// Public routes
router.get('/email/verify/:token', verifyEmail);

// Protected routes - require authentication
router.use(protect);

// Email Verification
router.post('/email/send', sendEmailVerification);

// Phone Verification
router.post('/phone/send', sendPhoneOTP);
router.post('/phone/verify', verifyPhoneOTP);

// ID Verification
router.post('/id/submit', submitIDVerification);

// Biometric Verification
router.post('/biometric/verify', verifyBiometric);

// Social Proof
router.post('/social/linkedin', connectLinkedIn);
router.post('/social/github', connectGitHub);

// Get Status
router.get('/status', getVerificationStatus);
router.get('/status/:userId', getVerificationStatus);

// Reputation
router.get('/reputation', getReputation);
router.get('/reputation/:userId', getReputation);
router.post('/reputation/recalculate', recalculateReputation);
router.post('/reputation/:userId/recalculate', recalculateReputation);

export default router;
