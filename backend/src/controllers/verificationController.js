import VerificationService from '../services/verification.service.js';
import ReputationService from '../services/reputation.service.js';

/**
 * Verification Controller - Handles all verification endpoints
 */

// Send Email Verification
export const sendEmailVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    const result = await VerificationService.sendEmailVerification(userId, email);
    
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email with Token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await VerificationService.verifyEmailToken(token);
    
    res.json({
      status: result.success ? 'success' : 'error',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Send Phone OTP
export const sendPhoneOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    const result = await VerificationService.sendPhoneOTP(userId, phoneNumber);
    
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Verify Phone OTP
export const verifyPhoneOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    const result = await VerificationService.verifyPhoneOTP(userId, otp);
    
    res.json({
      status: result.success ? 'success' : 'error',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Submit ID Verification
export const submitIDVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentData = req.body;

    const result = await VerificationService.submitIDVerification(userId, documentData);
    
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Verify Biometric (Selfie)
export const verifyBiometric = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { selfieImage, faceMatchScore } = req.body;

    const result = await VerificationService.verifyBiometric(userId, selfieImage, faceMatchScore);
    
    res.json({
      status: result.success ? 'success' : 'error',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Connect LinkedIn
export const connectLinkedIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const linkedInData = req.body;

    const result = await VerificationService.connectLinkedIn(userId, linkedInData);
    
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Connect GitHub
export const connectGitHub = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const githubData = req.body;

    const result = await VerificationService.connectGitHub(userId, githubData);
    
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Get Verification Status
export const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;

    const status = await VerificationService.getVerificationStatus(userId);
    
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// Get Reputation
export const getReputation = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;

    const reputation = await ReputationService.getReputationDisplay(userId);
    
    res.json({
      status: 'success',
      data: reputation
    });
  } catch (error) {
    next(error);
  }
};

// Recalculate Reputation (Admin or Self)
export const recalculateReputation = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Only allow user to recalculate own reputation or admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const reputation = await ReputationService.recalculateReputation(userId);
    
    res.json({
      status: 'success',
      message: 'Reputation recalculated',
      data: {
        overallScore: reputation.overallScore,
        localTrustScore: reputation.localTrustScore,
        skillTrustScore: reputation.skillTrustScore
      }
    });
  } catch (error) {
    next(error);
  }
};
