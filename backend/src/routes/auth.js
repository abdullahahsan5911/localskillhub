import express from 'express';
import { body } from 'express-validator';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  oauthLogin,
  verifyOtp,
  resendOtp,
  requestPhoneOtp,
  verifyPhoneOtp,
  resendPhoneOtp,
  verifyPhoneFirebase
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const otpGuard = process.env.NODE_ENV === 'production'
  ? otpLimiter
  : (req, res, next) => next();

// Public routes
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.post('/logout', logout);

// OAuth (Google / GitHub via Firebase)
router.post('/oauth', authLimiter, oauthLogin);

// OTP email verification
router.post('/verify-otp', otpGuard, verifyOtp);
router.post('/resend-otp', otpGuard, resendOtp);

// Phone verification (Firebase OTP)
router.post('/request-phone-otp', otpGuard, protect, requestPhoneOtp);
router.post('/verify-phone-otp', otpGuard, protect, verifyPhoneOtp);
router.post('/resend-phone-otp', otpGuard, protect, resendPhoneOtp);
router.post('/verify-phone-firebase', otpGuard, protect, verifyPhoneFirebase);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationEmail);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
