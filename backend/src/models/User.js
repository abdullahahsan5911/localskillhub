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
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'both'],
    default: 'freelancer'
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
      enum: ['email', 'phone', 'id', 'selfie', 'college', 'workshop', 'employer']
    },
    verifiedAt: Date,
    verifiedBy: String
  }],
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
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
