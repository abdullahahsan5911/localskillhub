import mongoose from 'mongoose';

/**
 * Reputation Model - Tracks comprehensive reputation metrics
 * Combines verification, reviews, endorsements, events, employer trust, referrals
 */
const reputationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Overall Reputation Score (0-100)
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Local Trust Score (0-100) - Region-specific reputation
  localTrustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Skill Trust Score (0-100) - Technical competency
  skillTrustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Component Scores
  scores: {
    // Verification Score (from Verification model)
    verification: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 25 }
    },
    // Client Reviews
    reviews: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 20 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 }
      }
    },
    // Community Endorsements
    endorsements: {
      totalEndorsements: { type: Number, default: 0 },
      uniqueEndorsers: { type: Number, default: 0 },
      skillEndorsements: [{ 
        skill: String, 
        count: Number 
      }],
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 15 }
    },
    // Event Participation
    events: {
      eventsAttended: { type: Number, default: 0 },
      workshopsCompleted: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 10 }
    },
    // Local Employer Trust
    employerTrust: {
      localJobsCompleted: { type: Number, default: 0 },
      localClientsServed: { type: Number, default: 0 },
      repeatClientRate: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 15 }
    },
    // Referral Score
    referrals: {
      referralsSent: { type: Number, default: 0 },
      referralsHired: { type: Number, default: 0 },
      referralConversionRate: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 10 }
    },
    // Performance Metrics
    performance: {
      onTimeDeliveryRate: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      responseTime: { type: Number, default: 24 }, // hours
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 5 }
    }
  },
  // Regional Reputation (city/state specific)
  regionalScores: [{
    region: String, // "Mumbai, Maharashtra" or "Maharashtra, India"
    score: Number,
    jobsCompleted: Number,
    lastUpdated: Date
  }],
  // Category-Specific Scores
  categoryScores: [{
    category: String,
    score: Number,
    jobsCompleted: Number,
    averageRating: Number
  }],
  // Badges & Achievements
  achievements: [{
    type: {
      type: String,
      enum: [
        'top_rated',
        'rising_talent',
        'expert_verified',
        'quick_responder',
        'reliable_partner',
        'community_leader',
        'local_hero',
        'skill_master',
        'five_star_freelancer',
        'client_favorite',
        'long_term_partner'
      ]
    },
    earnedAt: Date,
    expiresAt: Date,
    criteria: String
  }],
  // Trust Indicators
  trustIndicators: {
    verifiedIdentity: { type: Boolean, default: false },
    backgroundChecked: { type: Boolean, default: false },
    paymentVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    linkedinConnected: { type: Boolean, default: false },
    portfolioVerified: { type: Boolean, default: false }
  },
  // Statistics for Score Calculation
  stats: {
    totalJobsCompleted: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    activeJobsCount: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageProjectValue: { type: Number, default: 0 },
    clientRetentionRate: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    proposalAcceptanceRate: { type: Number, default: 0 }
  },
  // Last Calculation
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  // Score History (for trending)
  scoreHistory: [{
    date: Date,
    overallScore: Number,
    localScore: Number,
    skillScore: Number
  }]
}, {
  timestamps: true
});

// Calculate Overall Score
reputationSchema.methods.calculateOverallScore = function() {
  const { scores } = this;
  let totalScore = 0;
  let totalWeight = 0;

  // Sum weighted scores
  Object.values(scores).forEach(component => {
    if (component.score !== undefined && component.weight !== undefined) {
      totalScore += component.score * (component.weight / 100);
      totalWeight += component.weight;
    }
  });

  // Normalize to 0-100 scale
  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
};

// Calculate Local Trust Score
reputationSchema.methods.calculateLocalTrustScore = function() {
  const verificationScore = this.scores.verification.score * 0.3;
  const employerScore = this.scores.employerTrust.score * 0.4;
  const reviewScore = this.scores.reviews.score * 0.2;
  const eventScore = this.scores.events.score * 0.1;
  
  return Math.round(verificationScore + employerScore + reviewScore + eventScore);
};

// Calculate Skill Trust Score
reputationSchema.methods.calculateSkillTrustScore = function() {
  const endorsementScore = this.scores.endorsements.score * 0.4;
  const reviewScore = this.scores.reviews.score * 0.35;
  const performanceScore = this.scores.performance.score * 0.25;
  
  return Math.round(endorsementScore + reviewScore + performanceScore);
};

// Update all reputation scores
reputationSchema.methods.updateAllScores = async function() {
  // Calculate Review Score (0-100 based on average rating)
  if (this.scores.reviews.totalReviews > 0) {
    this.scores.reviews.score = (this.scores.reviews.averageRating / 5) * 100;
  }
  
  // Calculate Endorsement Score
  const endorsementScore = Math.min(
    (this.scores.endorsements.totalEndorsements / 10) * 100,
    100
  );
  this.scores.endorsements.score = endorsementScore;
  
  // Calculate Event Score
  const eventScore = Math.min(
    (this.scores.events.eventsAttended / 5) * 100,
    100
  );
  this.scores.events.score = eventScore;
  
  // Calculate Employer Trust Score
  const employerScore = Math.min(
    ((this.scores.employerTrust.localJobsCompleted / 20) * 60) +
    (this.scores.employerTrust.repeatClientRate * 40),
    100
  );
  this.scores.employerTrust.score = employerScore;
  
  // Calculate Referral Score
  if (this.scores.referrals.referralsSent > 0) {
    this.scores.referrals.referralConversionRate = 
      (this.scores.referrals.referralsHired / this.scores.referrals.referralsSent) * 100;
  }
  this.scores.referrals.score = Math.min(this.scores.referrals.referralConversionRate, 100);
  
  // Calculate Performance Score
  const performanceScore = (
    (this.scores.performance.onTimeDeliveryRate * 0.5) +
    (this.scores.performance.completionRate * 0.5)
  );
  this.scores.performance.score = performanceScore;
  
  // Calculate final scores
  this.overallScore = this.calculateOverallScore();
  this.localTrustScore = this.calculateLocalTrustScore();
  this.skillTrustScore = this.calculateSkillTrustScore();
  
  // Update last calculated timestamp
  this.lastCalculated = new Date();
  
  // Add to history (keep last 30 entries)
  this.scoreHistory.push({
    date: new Date(),
    overallScore: this.overallScore,
    localScore: this.localTrustScore,
    skillScore: this.skillTrustScore
  });
  
  if (this.scoreHistory.length > 30) {
    this.scoreHistory = this.scoreHistory.slice(-30);
  }
  
  await this.save();
};

// Auto-calculate scores before saving
reputationSchema.pre('save', function(next) {
  if (this.isModified('scores')) {
    this.overallScore = this.calculateOverallScore();
    this.localTrustScore = this.calculateLocalTrustScore();
    this.skillTrustScore = this.calculateSkillTrustScore();
  }
  next();
});

const Reputation = mongoose.model('Reputation', reputationSchema);

export default Reputation;
