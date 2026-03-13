import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { AppError } from '../middleware/errorHandler.js';
import GeoLocationService from '../services/geolocation.service.js';
import { firebaseAuth } from '../config/firebaseAdmin.js';
import { sendOtpEmail } from '../services/email.service.js';

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hasCompletedOnboardingData = (user) => {
  const hasLocation = Boolean(user?.location?.city && user?.location?.state && user?.location?.country);
  const hasInterests = Array.isArray(user?.interests) && user.interests.length > 0;
  return hasLocation && hasInterests;
};


// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      status: 'success',
      token,
      data: {
        user: user.getPublicProfile()
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, email, password, role, location, interests } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If already registered but not verified, resend OTP
      if (!existingUser.isEmailVerified) {
        const otp = generateOtp();
        existingUser.emailOtp = otp;
        existingUser.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await existingUser.save({ validateBeforeSave: false });
        await sendOtpEmail(email, existingUser.name, otp);
        return res.status(200).json({
          status: 'success',
          message: 'Account exists but email not verified. A new OTP has been sent.',
          data: { emailVerificationRequired: true, email }
        });
      }
      return next(new AppError('Email already registered', 400));
    }

    const normalizedLocation = location
      ? await GeoLocationService.normalizeLocation(location)
      : undefined;

    // Create user (unverified)
    const otp = generateOtp();
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'client',
      location: normalizedLocation,
      interests,
      onboardingCompleted: Boolean(role && normalizedLocation),
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    // Create freelancer profile if needed
    if ((role === 'freelancer' || role === 'both') && (user.role === 'freelancer' || user.role === 'both')) {
      await FreelancerProfile.create({
        userId: user._id,
        title: `${name} - Professional Freelancer`,
        bio: '',
        rates: { minRate: 0, maxRate: 0 }
      });
    }

    // Send OTP email
    try {
      await sendOtpEmail(email, name, otp);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
      // Don't fail registration if email fails — user can request resend
    }

    res.status(201).json({
      status: 'success',
      message: 'Account created. Please verify your email with the OTP sent to your inbox.',
      data: { emailVerificationRequired: true, email }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user with password
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Block unverified email/password accounts (OAuth users are always verified)
    if (!user.isEmailVerified && user.provider === 'local') {
      return res.status(403).json({
        status: 'error',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in. Check your inbox for the OTP.',
        data: { email }
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    user.lastActive = Date.now();

    // Heal legacy records where onboarding data exists but the flag remained false.
    if (!user.onboardingCompleted && hasCompletedOnboardingData(user)) {
      user.onboardingCompleted = true;
    }

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400));
    }

    const user = await User.findOne({ email }).select('+emailOtp +emailOtpExpiry');

    if (!user) {
      return next(new AppError('No account found with this email', 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email already verified. Please sign in.', 400));
    }

    if (!user.emailOtp || !user.emailOtpExpiry) {
      return next(new AppError('No OTP found. Please request a new one.', 400));
    }

    if (new Date() > user.emailOtpExpiry) {
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    }

    if (user.emailOtp !== otp.trim()) {
      return next(new AppError('Invalid OTP. Please try again.', 400));
    }

    // Mark verified and clear OTP
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend email OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('No account found with this email', 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email already verified. Please sign in.', 400));
    }

    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, user.name, otp);

    res.json({
      status: 'success',
      message: 'A new OTP has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Keep old accounts from being trapped in onboarding due to stale flags.
    if (!user.onboardingCompleted && hasCompletedOnboardingData(user)) {
      user.onboardingCompleted = true;
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      status: 'success',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const normalizedLocation = req.body.location
      ? await GeoLocationService.normalizeLocation(req.body.location)
      : undefined;

    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      location: normalizedLocation,
      socialLinks: req.body.socialLinks,
      interests: req.body.interests,
      avatar: req.body.avatar,
      onboardingCompleted: req.body.onboardingCompleted,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    if ((user.role === 'freelancer' || user.role === 'both')) {
      const existingProfile = await FreelancerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await FreelancerProfile.create({
          userId: user._id,
          title: `${user.name} - Professional Freelancer`,
          bio: '',
          rates: {
            minRate: 0,
            maxRate: 0,
          },
        });
      }
    }

    res.json({
      status: 'success',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+passwordHash');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('No user found with that email', 404));
    }

    // TODO: Generate reset token and send email
    const resetToken = crypto.randomBytes(32).toString('hex');

    res.json({
      status: 'success',
      message: 'Password reset email sent',
      // Remove in production - only for testing
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // TODO: Implement token verification
    const { password } = req.body;

    res.json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    // TODO: Implement email verification
    res.json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res, next) => {
  try {
    // TODO: Implement resend verification
    res.json({
      status: 'success',
      message: 'Verification email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth login/register via Firebase (Google or GitHub)
// @route   POST /api/auth/oauth
// @access  Public
export const oauthLogin = async (req, res, next) => {
  try {
    const { idToken, provider } = req.body;

    if (!idToken || !provider) {
      return next(new AppError('idToken and provider are required', 400));
    }

    if (!['google', 'github', 'email'].includes(provider)) {
      return next(new AppError('Provider must be google, github, or email', 400));
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(idToken);
    } catch (err) {
      return next(new AppError('Invalid or expired Firebase token', 401));
    }

    const { uid, email, name, picture, email_verified } = decodedToken;

    // Google requires verified email
    if (provider === 'google' && !email_verified) {
      return next(new AppError('Please verify your Google email before signing in', 403));
    }

    if (!email) {
      return next(new AppError('No email associated with this account', 400));
    }

    // Upsert user: find by firebaseUid first, then by email
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if there's an existing email/password user with this email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Firebase UID to existing account
        user.firebaseUid = uid;
        user.provider = provider;
        if (picture && !user.avatar.startsWith('https://ui-avatars.com')) {
          user.avatar = picture;
        }
        user.isEmailVerified = true;
        user.lastActive = Date.now();
        await user.save();
      } else {
        // Create brand-new OAuth user
        user = await User.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          firebaseUid: uid,
          provider,
          avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`,
          isEmailVerified: true,
          role: 'client',
          onboardingCompleted: false,
        });
      }
    } else {
      // Existing OAuth user — refresh info
      if (name) user.name = name;
      if (picture) user.avatar = picture;
      user.lastActive = Date.now();
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
