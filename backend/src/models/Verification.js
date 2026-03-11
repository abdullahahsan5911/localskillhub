import mongoose from 'mongoose';

/**
 * Verification Model - Tracks multi-layered verification attempts and status
 * Supports: Email, Phone, ID, Selfie, Social Proof, Education, Employment
 */
const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Email Verification
  email: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    token: String,
    tokenExpires: Date,
    attempts: { type: Number, default: 0 },
    lastAttempt: Date
  },
  // Phone Verification  
  phone: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    phoneNumber: String,
    otp: String,
    otpExpires: Date,
    attempts: { type: Number, default: 0 },
    lastAttempt: Date
  },
  // Government ID Verification
  identity: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: String, // admin ID or service name
    documentType: {
      type: String,
      enum: ['passport', 'drivers_license', 'national_id', 'aadhar', 'pan']
    },
    documentNumber: String, // encrypted
    documentImages: [String], // Cloudinary URLs
    extractedData: {
      fullName: String,
      dateOfBirth: Date,
      address: String,
      documentExpiry: Date
    },
    verificationNotes: String,
    rejectionReason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending'
    }
  },
  // Selfie/Biometric Verification (Face Match)
  biometric: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    selfieImage: String, // Cloudinary URL
    faceMatchScore: Number, // 0-100
    livenessCheckPassed: Boolean,
    attempts: { type: Number, default: 0 },
    lastAttempt: Date
  },
  // Social Proof Aggregation
  socialProof: {
    linkedin: {
      connected: { type: Boolean, default: false },
      profileUrl: String,
      verifiedAt: Date,
      profileData: {
        headline: String,
        connectionsCount: Number,
        endorsements: Number,
        recommendations: Number
      },
      lastSynced: Date
    },
    github: {
      connected: { type: Boolean, default: false },
      username: String,
      verifiedAt: Date,
      profileData: {
        repositories: Number,
        followers: Number,
        contributions: Number,
        stars: Number
      },
      lastSynced: Date
    },
    portfolio: {
      verified: { type: Boolean, default: false },
      url: String,
      verifiedAt: Date,
      screenshots: [String],
      sslValid: Boolean
    },
    behance: {
      connected: { type: Boolean, default: false },
      username: String,
      profileUrl: String,
      projectCount: Number,
      appreciations: Number,
      views: Number,
      lastSynced: Date
    },
    dribbble: {
      connected: { type: Boolean, default: false },
      username: String,
      profileUrl: String,
      shotsCount: Number,
      likes: Number,
      lastSynced: Date
    }
  },
  // Education Verification
  education: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    institutions: [{
      name: String,
      degree: String,
      field: String,
      graduationYear: Number,
      verified: Boolean,
      verificationMethod: String, // 'manual', 'api', 'document'
      documents: [String], // Cloudinary URLs
      verifiedBy: String
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  // Employer/Reference Verification
  employment: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    references: [{
      companyName: String,
      contactName: String,
      contactEmail: String,
      contactPhone: String,
      verified: Boolean,
      verificationCode: String,
      verifiedAt: Date,
      feedback: String,
      rating: Number
    }],
    letterOfRecommendation: [String] // Cloudinary URLs
  },
  // Workshop/Event Attendance
  events: {
    count: { type: Number, default: 0 },
    attended: [{
      eventId: String,
      eventName: String,
      eventDate: Date,
      verifiedAt: Date,
      certificateUrl: String
    }]
  },
  // Overall Verification Level
  verificationLevel: {
    type: String,
    enum: ['unverified', 'basic', 'standard', 'advanced', 'premium'],
    default: 'unverified'
  },
  verificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Trust Indicators
  trustBadges: [{
    type: {
      type: String,
      enum: [
        'email_verified',
        'phone_verified',
        'id_verified',
        'selfie_verified',
        'linkedin_connected',
        'github_connected',
        'education_verified',
        'employer_verified',
        'event_participant',
        'top_rated',
        'quick_responder',
        'reliable_freelancer'
      ]
    },
    earnedAt: Date,
    expiresAt: Date
  }]
}, {
  timestamps: true
});

// Method to calculate verification score
verificationSchema.methods.calculateVerificationScore = function() {
  let score = 0;
  
  // Email (10 points)
  if (this.email.verified) score += 10;
  
  // Phone (10 points)
  if (this.phone.verified) score += 10;
  
  // ID Verification (25 points)
  if (this.identity.verified) score += 25;
  
  // Biometric (15 points)
  if (this.biometric.verified) score += 15;
  
  // Social Proof (20 points total)
  if (this.socialProof.linkedin.connected) score += 7;
  if (this.socialProof.github.connected) score += 7;
  if (this.socialProof.portfolio.verified) score += 6;
  
  // Education (10 points)
  if (this.education.verified) score += 10;
  
  // Employment (10 points)
  if (this.employment.verified) score += 10;
  
  return Math.min(score, 100);
};

// Method to determine verification level
verificationSchema.methods.determineVerificationLevel = function() {
  const score = this.calculateVerificationScore();
  
  if (score >= 80) return 'premium';
  if (score >= 60) return 'advanced';
  if (score >= 40) return 'standard';
  if (score >= 20) return 'basic';
  return 'unverified';
};

// Auto-update verification score and level before saving
verificationSchema.pre('save', function(next) {
  this.verificationScore = this.calculateVerificationScore();
  this.verificationLevel = this.determineVerificationLevel();
  next();
});

const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;
