import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: (value) => value === undefined || (Array.isArray(value) && value.length === 2),
        message: 'Point coordinates must contain [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    sparse: true
  },
  passwordHash: {
    type: String,
    required: false,   // OAuth users don't have a password
    minlength: 6,
    select: false
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  accountType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    default: 'freelancer'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: pointSchema,
      default: undefined,
    }
  },
  verifiedBadges: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'id', 'selfie', 'college', 'workshop', 'employer', 'github']
    },
    verifiedAt: Date,
    verifiedBy: String
  }],
  // Admin-assigned badges
  adminBadges: [{
    type: {
      type: String,
      enum: ['verified', 'top_freelancer', 'rising_talent', 'local_verified', 'trusted_client', 'featured_visualization']
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Admin moderation
  isBanned: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,
  suspendedUntil: Date,
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  adminNotes: String,
  warnings: [{
    reason: String,
    createdAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  warningCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isSuperAdmin: { type: Boolean, default: false },
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
    instagram: String
  },
  interests: [String],
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User'
  },
  bannerImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String,
    select: false
  },
  emailOtpExpiry: {
    type: Date,
    select: false
  },
  resetPasswordOtp: {
    type: String,
    select: false
  },
  resetPasswordOtpExpiry: {
    type: Date,
    select: false
  },
  phoneOtp: {
    type: String,   // Store as plain string to compare directly
    select: false
  },
  phoneOtpExpiry: {
    type: Date,
    select: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  onboarding: {
    completed: {
      type: Boolean,
      default: false
    },
    skipped: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    skippedAt: Date,
    lastStep: {
      type: Number,
      default: 1
    }
  },
  // Legacy field for backward compatibility
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

userSchema.pre('validate', function(next) {
  const coords = this.location?.coordinates?.coordinates;
  const hasValidPoint = Array.isArray(coords) && coords.length === 2;

  if (this.location?.coordinates && !hasValidPoint) {
    this.location.coordinates = undefined;
  }

  const hasLocationText = Boolean(this.location?.city || this.location?.state || this.location?.country);
  if (this.location && !hasLocationText && !this.location.coordinates) {
    this.location = undefined;
  }

  next();
});

// Hash password before saving (skip for OAuth users without a password)
userSchema.pre('save', async function(next) {
  if (!this.passwordHash) return next();
  if (!this.isModified('passwordHash')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile (SAFE - no sensitive data)
// This is also used for the authenticated user's session payload,
// so include non-sensitive fields needed by the frontend such as
// location, interests, and onboarding status.
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    provider: this.provider || 'local',
    accountType: this.accountType,
    companyId: this.companyId,
    location: this.location,
    interests: this.interests || [],
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified || false,
    verifiedBadges: this.verifiedBadges || [],
    adminBadges: this.adminBadges || [],
    onboardingCompleted: this.onboardingCompleted,
    // Account status
    isBanned: this.isBanned || false,
    isSuspended: this.isSuspended || false,
    suspendedUntil: this.suspendedUntil,
    warningCount: this.warningCount || 0,
    riskLevel: this.riskLevel || 'low',
    // Lightweight relationship fields needed by frontend
    // Expose savedJobs as simple IDs so dashboards and job pages
    // can accurately reflect bookmarked jobs across sessions.
    following: (this.following || []).map((entry) => {
      if (entry && entry._id) {
        return entry._id.toString();
      }
      return entry?.toString?.() ?? String(entry);
    }),
    followers: (this.followers || []).map((entry) => {
      if (entry && entry._id) {
        return entry._id.toString();
      }
      return entry?.toString?.() ?? String(entry);
    }),
    savedJobs: (this.savedJobs || []).map((job) => {
      // Handle both raw ObjectId values and populated docs
      if (job && job._id) {
        return job._id.toString();
      }
      return job?.toString?.() ?? String(job);
    }),
    // Legacy/public profile fields
    headline: this.headline,
    skills: this.skills || [],
    rating: this.rating || 0,
    totalReviews: this.totalReviews || 0,
    isVerified: this.isVerified || false,
    badges: this.badges || [],
    bio: this.bio,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
