import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export const verifyPhone = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    // TODO: Send SMS verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    
    res.json({
      status: 'success',
      message: 'Verification code sent',
      code: verificationCode // Remove in production
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPhoneCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    // TODO: Verify code
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isPhoneVerified: true,
        $push: {
          verifiedBadges: {
            type: 'phone',
            verifiedAt: Date.now()
          }
        }
      },
      { new: true }
    );

    res.json({
      status: 'success',
      message: 'Phone verified successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isEmailVerified: true,
        $push: {
          verifiedBadges: {
            type: 'email',
            verifiedAt: Date.now()
          }
        }
      },
      { new: true }
    );

    res.json({
      status: 'success',
      message: 'Email verified successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyId = async (req, res, next) => {
  try {
    // TODO: Implement ID verification logic
    res.json({
      status: 'success',
      message: 'ID verification submitted for review'
    });
  } catch (error) {
    next(error);
  }
};

export const verifySelfie = async (req, res, next) => {
  try {
    // TODO: Implement selfie verification with face match
    res.json({
      status: 'success',
      message: 'Selfie verification submitted'
    });
  } catch (error) {
    next(error);
  }
};

export const getSocialProof = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        socialLinks: user.socialLinks,
        verifiedBadges: user.verifiedBadges
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addBadge = async (req, res, next) => {
  try {
    const { type, verifiedBy } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          verifiedBadges: {
            type,
            verifiedAt: Date.now(),
            verifiedBy
          }
        }
      },
      { new: true }
    );

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
