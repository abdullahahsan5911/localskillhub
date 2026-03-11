import Verification from '../models/Verification.js';
import Reputation from '../models/Reputation.js';
import User from '../models/User.js';
import crypto from 'crypto';

/**
 * Verification Service - Handles all verification operations
 * Supports email, phone, ID, biometric, social proof, education, employment
 */

// Email transporter - will be lazily initialized
let transporter = null;

// Helper function to get or create email transporter
async function getEmailTransporter() {
  if (transporter) return transporter;
  
  // Only create if SMTP credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured - emails will be logged to console');
    return null;
  }
  
  try {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    return null;
  }
}

class VerificationService {
  /**
   * Initialize verification record for a user
   */
  static async initializeVerification(userId) {
    try {
      let verification = await Verification.findOne({ userId });
      
      if (!verification) {
        verification = new Verification({ userId });
        await verification.save();
      }
      
      return verification;
    } catch (error) {
      throw new Error(`Failed to initialize verification: ${error.message}`);
    }
  }

  /**
   * Send Email Verification
   */
  static async sendEmailVerification(userId, email) {
    try {
      const verification = await this.initializeVerification(userId);
      
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      verification.email.token = token;
      verification.email.tokenExpires = tokenExpires;
      verification.email.lastAttempt = new Date();
      verification.email.attempts += 1;
      
      await verification.save();
      
      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
      
      const emailContent = {
        from: process.env.SMTP_FROM || 'noreply@localskillhub.com',
        to: email,
        subject: 'Verify Your Email - LocalSkillHub',
        html: `
          <h2>Email Verification</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>This link expires in 24 hours.</p>
        `
      };
      
      const transporter = await getEmailTransporter();
      
      if (transporter) {
        await transporter.sendMail(emailContent);
        console.log(`✅ Verification email sent to ${email}`);
      } else {
        // Log email for development when SMTP is not configured
        console.log('\n📧 EMAIL (SMTP not configured):');
        console.log(`To: ${email}`);
        console.log(`Subject: ${emailContent.subject}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log(`Token: ${token}\n`);
      }
      
      return { success: true, message: 'Verification email sent', token: process.env.NODE_ENV === 'development' ? token : undefined };
    } catch (error) {
      throw new Error(`Failed to send email verification: ${error.message}`);
    }
  }

  /**
   * Verify Email Token
   */
  static async verifyEmailToken(token) {
    try {
      const verification = await Verification.findOne({ 'email.token': token });
      
      if (!verification) {
        return { success: false, message: 'Invalid verification token' };
      }
      
      if (new Date() > verification.email.tokenExpires) {
        return { success: false, message: 'Verification token expired' };
      }
      
      verification.email.verified = true;
      verification.email.verifiedAt = new Date();
      verification.email.token = undefined;
      verification.email.tokenExpires = undefined;
      
      // Add email verified badge
      verification.trustBadges.push({
        type: 'email_verified',
        earnedAt: new Date()
      });
      
      await verification.save();
      
      // Update user
      await User.findByIdAndUpdate(verification.userId, {
        isEmailVerified: true
      });
      
      // Update reputation
      await this.updateReputationAfterVerification(verification.userId);
      
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }

  /**
   * Send Phone OTP
   */
  static async sendPhoneOTP(userId, phoneNumber) {
    try {
      const verification = await this.initializeVerification(userId);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      verification.phone.otp = otp;
      verification.phone.otpExpires = otpExpires;
      verification.phone.phoneNumber = phoneNumber;
      verification.phone.lastAttempt = new Date();
      verification.phone.attempts += 1;
      
      await verification.save();
      
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`OTP for ${phoneNumber}: ${otp}`); // Development only
      
      return { success: true, message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
    } catch (error) {
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  /**
   * Verify Phone OTP
   */
  static async verifyPhoneOTP(userId, otp) {
    try {
      const verification = await Verification.findOne({ userId });
      
      if (!verification || !verification.phone.otp) {
        return { success: false, message: 'No OTP request found' };
      }
      
      if (new Date() > verification.phone.otpExpires) {
        return { success: false, message: 'OTP expired' };
      }
      
      if (verification.phone.otp !== otp) {
        return { success: false, message: 'Invalid OTP' };
      }
      
      verification.phone.verified = true;
      verification.phone.verifiedAt = new Date();
      verification.phone.otp = undefined;
      verification.phone.otpExpires = undefined;
      
      // Add phone verified badge
      verification.trustBadges.push({
        type: 'phone_verified',
        earnedAt: new Date()
      });
      
      await verification.save();
      
      // Update user
      await User.findByIdAndUpdate(userId, {
        isPhoneVerified: true,
        phone: verification.phone.phoneNumber
      });
      
      // Update reputation
      await this.updateReputationAfterVerification(userId);
      
      return { success: true, message: 'Phone verified successfully' };
    } catch (error) {
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }

  /**
   * Submit ID Verification
   */
  static async submitIDVerification(userId, documentData) {
    try {
      const verification = await this.initializeVerification(userId);
      
      verification.identity = {
        verified: false,
        documentType: documentData.documentType,
        documentNumber: documentData.documentNumber, // Should be encrypted
        documentImages: documentData.documentImages,
        extractedData: documentData.extractedData || {},
        status: 'pending'
      };
      
      await verification.save();
      
      return { success: true, message: 'ID verification submitted for review' };
    } catch (error) {
      throw new Error(`Failed to submit ID verification: ${error.message}`);
    }
  }

  /**
   * Verify Biometric (Selfie/Face Match)
   */
  static async verifyBiometric(userId, selfieImage, faceMatchScore) {
    try {
      const verification = await this.initializeVerification(userId);
      
      const passed = faceMatchScore >= 80; // 80% match threshold
      
      verification.biometric = {
        verified: passed,
        verifiedAt: passed ? new Date() : undefined,
        selfieImage,
        faceMatchScore,
        livenessCheckPassed: true,
        attempts: verification.biometric.attempts + 1,
        lastAttempt: new Date()
      };
      
      if (passed) {
        verification.trustBadges.push({
          type: 'selfie_verified',
          earnedAt: new Date()
        });
      }
      
      await verification.save();
      
      if (passed) {
        await this.updateReputationAfterVerification(userId);
      }
      
      return { 
        success: passed, 
        message: passed ? 'Biometric verification successful' : 'Face match score too low',
        score: faceMatchScore
      };
    } catch (error) {
      throw new Error(`Failed to verify biometric: ${error.message}`);
    }
  }

  /**
   * Connect LinkedIn
   */
  static async connectLinkedIn(userId, linkedInData) {
    try {
      const verification = await this.initializeVerification(userId);
      
      verification.socialProof.linkedin = {
        connected: true,
        profileUrl: linkedInData.profileUrl,
        verifiedAt: new Date(),
        profileData: {
          headline: linkedInData.headline,
          connectionsCount: linkedInData.connectionsCount || 0,
          endorsements: linkedInData.endorsements || 0,
          recommendations: linkedInData.recommendations || 0
        },
        lastSynced: new Date()
      };
      
      verification.trustBadges.push({
        type: 'linkedin_connected',
        earnedAt: new Date()
      });
      
      await verification.save();
      await this.updateReputationAfterVerification(userId);
      
      return { success: true, message: 'LinkedIn connected successfully' };
    } catch (error) {
      throw new Error(`Failed to connect LinkedIn: ${error.message}`);
    }
  }

  /**
   * Connect GitHub
   */
  static async connectGitHub(userId, githubData) {
    try {
      const verification = await this.initializeVerification(userId);
      
      verification.socialProof.github = {
        connected: true,
        username: githubData.username,
        verifiedAt: new Date(),
        profileData: {
          repositories: githubData.repositories || 0,
          followers: githubData.followers || 0,
          contributions: githubData.contributions || 0,
          stars: githubData.stars || 0
        },
        lastSynced: new Date()
      };
      
      verification.trustBadges.push({
        type: 'github_connected',
        earnedAt: new Date()
      });
      
      await verification.save();
      await this.updateReputationAfterVerification(userId);
      
      return { success: true, message: 'GitHub connected successfully' };
    } catch (error) {
      throw new Error(`Failed to connect GitHub: ${error.message}`);
    }
  }

  /**
   * Update Reputation After Verification
   */
  static async updateReputationAfterVerification(userId) {
    try {
      const verification = await Verification.findOne({ userId });
      let reputation = await Reputation.findOne({ userId });
      
      if (!reputation) {
        reputation = new Reputation({ userId });
      }
      
      // Update verification score in reputation
      reputation.scores.verification.score = verification.verificationScore;
      
      // Update trust indicators
      reputation.trustIndicators = {
        verifiedIdentity: verification.identity.verified,
        phoneVerified: verification.phone.verified,
        emailVerified: verification.email.verified,
        linkedinConnected: verification.socialProof.linkedin.connected,
        portfolioVerified: verification.socialProof.portfolio.verified
      };
      
      await reputation.updateAllScores();
      
      return reputation;
    } catch (error) {
      console.error('Failed to update reputation:', error);
    }
  }

  /**
   * Get Verification Status
   */
  static async getVerificationStatus(userId) {
    try {
      const verification = await Verification.findOne({ userId });
      
      if (!verification) {
        return {
          verificationLevel: 'unverified',
          verificationScore: 0,
          verifications: {}
        };
      }
      
      return {
        verificationLevel: verification.verificationLevel,
        verificationScore: verification.verificationScore,
        verifications: {
          email: verification.email.verified,
          phone: verification.phone.verified,
          identity: verification.identity.verified,
          biometric: verification.biometric.verified,
          linkedin: verification.socialProof.linkedin.connected,
          github: verification.socialProof.github.connected,
          education: verification.education.verified,
          employment: verification.employment.verified
        },
        trustBadges: verification.trustBadges
      };
    } catch (error) {
      throw new Error(`Failed to get verification status: ${error.message}`);
    }
  }
}

export default VerificationService;
