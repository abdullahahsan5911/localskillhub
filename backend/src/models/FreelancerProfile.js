import mongoose from 'mongoose';

const freelancerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert']
    },
    yearsOfExperience: Number
  }],
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    link: String,
    category: String,
    completedAt: Date,
    tags: [String]
  }],
  rates: {
    minRate: {
      type: Number,
      required: true
    },
    maxRate: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    rateType: {
      type: String,
      enum: ['hourly', 'fixed', 'both'],
      default: 'hourly'
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available'
    },
    hoursPerWeek: Number,
    timezone: String,
    workingHours: {
      start: String,
      end: String
    }
  },
  endorsements: [{
    endorsedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    skill: String,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  localScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  globalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  skillScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native']
    }
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    startYear: Number,
    endYear: Number,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    credentialId: String,
    verificationUrl: String
  }],
  responseTime: {
    type: Number, // in hours
    default: 24
  },
  profileViews: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate overall score based on local, global, and skill scores
freelancerProfileSchema.methods.calculateOverallScore = function() {
  return Math.round((this.localScore + this.globalScore + this.skillScore) / 3);
};

const FreelancerProfile = mongoose.model('FreelancerProfile', freelancerProfileSchema);

export default FreelancerProfile;
