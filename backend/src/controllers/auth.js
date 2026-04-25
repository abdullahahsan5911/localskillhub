import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import https from 'https';
import User from '../models/User.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Reputation from '../models/Reputation.js';
import PlatformSettings from '../models/PlatformSettings.js';
import ReputationService from '../services/reputation.service.js';
import { AppError } from '../middleware/errorHandler.js';
import GeoLocationService from '../services/geolocation.service.js';
import { firebaseAuth } from '../config/firebaseAdmin.js';
import { sendOtpEmail } from '../services/email.service.js';
import { sendSmsOtp } from '../services/twilio.service.js';
import { uploadImage } from '../config/cloudinary.js';

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hasCompletedOnboardingData = (user) => {
  const hasLocation = Boolean(user?.location?.city && user?.location?.state && user?.location?.country);
  const hasInterests = Array.isArray(user?.interests) && user.interests.length > 0;
  return hasLocation && hasInterests;
};

// Download a remote image (e.g. Google avatar) and return as data URI
const downloadImageAsDataUri = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const statusCode = res.statusCode ?? 0;
        if (statusCode >= 400) {
          return reject(new Error(`Failed to download image. Status code: ${statusCode}`));
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            const header = res.headers['content-type'];
            const contentType = Array.isArray(header) ? header[0] : header || 'image/jpeg';
            const base64 = buffer.toString('base64');
            const dataUri = `data:${contentType};base64,${base64}`;
            resolve(dataUri);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
};

// Ensure OAuth avatar is mirrored to Cloudinary (for long-term stability)
const ensureCloudinaryAvatar = async (pictureUrl) => {
  try {
    if (!pictureUrl) return pictureUrl;

    // Already a Cloudinary URL
    if (pictureUrl.includes('res.cloudinary.com')) {
      return pictureUrl;
    }

    // Only mirror Google-hosted avatars to avoid unnecessary uploads
    if (!pictureUrl.includes('googleusercontent.com')) {
      return pictureUrl;
    }

    const dataUri = await downloadImageAsDataUri(pictureUrl);
    const result = await uploadImage(dataUri, 'avatars');
    return result.url || pictureUrl;
  } catch (err) {
    console.error('Failed to mirror OAuth avatar to Cloudinary:', err.message || err);
    return pictureUrl;
  }
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

const isBlockedTestEmail = (email) => {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  if (normalized.endsWith('@example.com')) return true;
  return false;
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

    const settings = await PlatformSettings.findOne();
    if (settings && settings.allowNewRegistrations === false) {
      return res.status(403).json({
        status: 'error',
        message: 'New registrations are currently disabled by the platform administrator.'
      });
    }

    const { name, email, password, role, location, interests } = req.body;

    if (isBlockedTestEmail(email)) {
      return next(new AppError('Please use a real email address', 400));
    }

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
    if (role === 'freelancer' && user.role === 'freelancer') {
      await FreelancerProfile.create({
        userId: user._id,
        title: `${name} - Professional Freelancer`,
        bio: '',
        rates: { minRate: 0, maxRate: 0 }
      });

      // Create Reputation record for new freelancer
      await Reputation.create({
        userId: user._id
      });

      // Calculate and populate initial reputation scores
      try {
        await ReputationService.recalculateReputation(user._id);
      } catch (error) {
        console.error('Failed to calculate initial reputation scores:', error);
        // Don't fail registration if reputation calculation fails
      }
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

    if (isBlockedTestEmail(email)) {
      return next(new AppError('Please use a real email address', 400));
    }

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

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_BANNED',
        message: 'Your account has been banned. Please contact support.',
        data: { email }
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      // Check if suspension has expired
      if (user.suspendedUntil && new Date(user.suspendedUntil) < new Date()) {
        // Auto-reinstate the user
        user.isSuspended = false;
        user.suspendedUntil = null;
      } else {
        const suspendedUntil = user.suspendedUntil 
          ? new Date(user.suspendedUntil).toLocaleDateString()
          : 'indefinitely';
        return res.status(403).json({
          status: 'error',
          code: 'ACCOUNT_SUSPENDED',
          message: `Your account is suspended until ${suspendedUntil}`,
          data: { email, suspendedUntil: user.suspendedUntil }
        });
      }
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
    const { email, otp, type } = req.body;

    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400));
    }

    const user = await User.findOne({ email }).select('+emailOtp +emailOtpExpiry');

    if (!user) {
      return next(new AppError('No account found with this email', 404));
    }

    if (user.isEmailVerified && type !== 'deletion') {
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
    if (type !== 'deletion') {
      user.isEmailVerified = true;
    }
    
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    if (type === 'deletion') {
      return res.json({ status: 'success', message: 'OTP verified successfully.' });
    }

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
    const { email, type } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('No account found with this email', 404));
    }

    if (user.isEmailVerified && type !== 'deletion') {
      return next(new AppError('Email already verified. Please sign in.', 400));
    }

    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, user.name || 'User', otp, type);

    res.json({
      status: 'success',
      message: type === 'deletion' ? 'A verification code for account deletion has been sent.' : 'A new OTP has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request phone OTP (Twilio SMS)
// @route   POST /api/auth/request-phone-otp
// @access  Protected
export const requestPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const userId = req.user._id;

    if (!phone) {
      return next(new AppError('Phone number is required', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if this phone number is already verified on a DIFFERENT account
    const existingWithPhone = await User.findOne({
      phone,
      isPhoneVerified: true,
      _id: { $ne: userId }
    });
    if (existingWithPhone) {
      return next(new AppError('This phone number is already linked to another account.', 400));
    }

    // Generate OTP and store in database
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phone = phone;
    user.phoneOtp = otp;
    user.phoneOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    // Send OTP via Twilio SMS
    try {
      console.log(`🔄 Attempting to send SMS OTP to ${phone}`);
      await sendSmsOtp(phone, otp);
      console.log(`✓ SMS OTP sent successfully to ${phone}`);
    } catch (smsError) {
      console.error('❌ Failed to send SMS OTP:', smsError.message);
      console.error('Error details:', smsError.status || smsError.code);
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(smsError); // Pass through the specific error from Twilio service
    }

    res.json({
      status: 'success',
      message: 'OTP sent to your phone number via SMS.',
      data: { phone, phoneNumberHash: phone.slice(-4) }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Verify phone OTP
// @route   POST /api/auth/verify-phone-otp
// @access  Protected
export const verifyPhoneOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    if (!otp) {
      return next(new AppError('OTP is required', 400));
    }

    const user = await User.findById(userId).select('+phoneOtp +phoneOtpExpiry');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isPhoneVerified) {
      return next(new AppError('Phone already verified.', 400));
    }

    if (!user.phoneOtp || !user.phoneOtpExpiry) {
      return next(new AppError('No OTP found. Please request a new one.', 400));
    }

    if (new Date() > user.phoneOtpExpiry) {
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    }

    if (user.phoneOtp !== otp.trim()) {
      return next(new AppError('Invalid OTP. Please try again.', 400));
    }

    // Mark verified and clear OTP
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpiry = undefined;

    // Add phone verified badge
    user.verifiedBadges.push({
      type: 'phone',
      verifiedAt: new Date(),
      verifiedBy: 'system'
    });

    await user.save({ validateBeforeSave: false });

    // Fetch complete user object to return
    const completeUser = await User.findById(userId);

    res.json({
      status: 'success',
      message: 'Phone verified successfully.',
      data: {
        user: completeUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend phone OTP
// @route   POST /api/auth/resend-phone-otp
// @access  Protected
export const resendPhoneOtp = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('+phoneOtp');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isPhoneVerified) {
      return next(new AppError('Phone already verified.', 400));
    }

    if (!user.phone) {
      return next(new AppError('No phone number on file. Please request a new OTP with a phone number.', 400));
    }

    const otp = generateOtp();
    user.phoneOtp = otp;
    user.phoneOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send OTP via Twilio SMS
    try {
      await sendSmsOtp(user.phone, otp);
    } catch (smsError) {
      console.error('Failed to send SMS OTP:', smsError.message);
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(smsError);
    }

    res.json({
      status: 'success',
      message: 'A new OTP has been sent to your phone.',
      data: { phoneNumberHash: user.phone.slice(-4) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone using Firebase ID token
// @route   POST /api/auth/verify-phone-firebase
// @access  Protected
export const verifyPhoneFirebase = async (req, res, next) => {
  try {
    const { token, phone } = req.body;
    const userId = req.user._id;

    if (!token) {
      return next(new AppError('Firebase ID token is required', 400));
    }

    if (!phone) {
      return next(new AppError('Phone number is required', 400));
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired Firebase token', 401));
    }

    // Firebase token should have phone_number claim if phone was verified
    if (!decodedToken.phone_number) {
      return next(new AppError('Phone number not verified in Firebase token', 403));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phone = phone;

    // Add phone verified badge
    const badgeExists = user.verifiedBadges.some(b => b.type === 'phone');
    if (!badgeExists) {
      user.verifiedBadges.push({
        type: 'phone',
        verifiedAt: new Date(),
        verifiedBy: 'firebase'
      });
    }

    await user.save({ validateBeforeSave: false });

    res.json({
      status: 'success',
      message: 'Phone verified successfully via Firebase.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
          verifiedBadges: user.verifiedBadges
        }
      }
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
      accountType: req.body.accountType,
      location: normalizedLocation,
      socialLinks: req.body.socialLinks,
      interests: req.body.interests,
      avatar: req.body.avatar,
      bannerImage: req.body.bannerImage,
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

    if (user.role === 'freelancer') {
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
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    if (isBlockedTestEmail(email)) {
      return next(new AppError('Please use a real email address', 400));
    }

    const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

    if (!user) {
      return next(new AppError('No user found with that email', 404));
    }

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    try {
      await sendOtpEmail(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('Failed to send password reset OTP email:', emailErr);
    }

    res.json({
      status: 'success',
      message: 'Password reset OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using email + OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return next(new AppError('Email, OTP and new password are required', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordOtpExpiry +passwordHash');

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return next(new AppError('Invalid or expired reset request', 400));
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    }

    if (user.resetPasswordOtp !== otp.trim()) {
      return next(new AppError('Invalid OTP. Please try again.', 400));
    }

    user.passwordHash = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

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

    // Prepare avatar URL (mirror Google avatar to Cloudinary when possible)
    const mirroredAvatarUrl = await ensureCloudinaryAvatar(picture);

    // Only Google auto-verifies email; GitHub users must go through OTP
    const isEmailAutoVerified = provider === 'google';

    // Upsert user: find by firebaseUid first, then by email
    let user = await User.findOne({ firebaseUid: uid });
    let isNewGithubUser = false;

    if (!user) {
      // Check if there's an existing email/password user with this email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Firebase UID to existing account
        user.firebaseUid = uid;
        user.provider = provider;
        // Do not overwrite avatar on account linking.
        // Existing users keep whatever profile photo they have set.
        // Only auto-verify email for Google; GitHub users keep their current email verification state
        if (isEmailAutoVerified) {
          user.isEmailVerified = true;
        }
        user.lastActive = Date.now();
        await user.save();
      } else {
        // Create brand-new OAuth user
        if (provider === 'github') {
          isNewGithubUser = true;
        }
        user = await User.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          firebaseUid: uid,
          provider,
          avatar: mirroredAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`,
          isEmailVerified: isEmailAutoVerified, // false for GitHub, true for Google
          role: 'client',
          onboardingCompleted: false,
        });
      }
    } else {
      // Existing OAuth user — refresh info
      if (name) user.name = name;
      // Never overwrite avatar during login for existing users.
      // Profile photo should only change through explicit profile update.
      user.lastActive = Date.now();
      // Skip full validation on login updates to prevent blocking users with legacy data (e.g. coordinates)
      await user.save({ validateBeforeSave: false });
    }

    // For new GitHub OAuth users, send an email OTP so they can verify their email
    if (isNewGithubUser && user.email) {
      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailOtp = otp;
        user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save({ validateBeforeSave: false });
        await sendOtpEmail(user.email, user.name, otp);
      } catch (emailErr) {
        console.error('Failed to send email OTP to new GitHub user:', emailErr);
        // Non-fatal — user can request resend from verification card
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

