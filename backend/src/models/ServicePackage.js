import mongoose from 'mongoose';

/**
 * Service Package Model - Freelancers can offer tiered service packages
 * Allows clients to choose from pre defined packages (Basic, Standard, Premium)
 */
const servicePackageSchema = new mongoose.Schema({
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // Package Tiers
  packages: {
    basic: {
      name: { type: String, default: 'Basic' },
      description: String,
      price: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      deliveryTime: { type: Number, required: true }, // in days
      revisions: { type: Number, default: 1 },
      features: [String],
      available: { type: Boolean, default: true }
    },
    standard: {
      name: { type: String, default: 'Standard' },
      description: String,
      price: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      deliveryTime: { type: Number, required: true },
      revisions: { type: Number, default: 3 },
      features: [String],
      available: { type: Boolean, default: true }
    },
    premium: {
      name: { type: String, default: 'Premium' },
      description: String,
      price: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      deliveryTime: { type: Number, required: true },
      revisions: { type: Number, default: -1 }, // -1 = unlimited
      features: [String],
      available: { type: Boolean, default: true }
    }
  },
  // Add-ons/Extras
  addOns: [{
    name: String,
    description: String,
    price: Number,
    deliveryTimeImpact: Number // additional days needed
  }],
  // Requirements from client
  requirements: [{
    question: String,
    type: { type: String, enum: ['text', 'file', 'multiple_choice', 'checkbox'] },
    required: Boolean,
    options: [String] // for multiple choice/checkbox
  }],
  // Samples/Portfolio for this service
  samples: [{
    title: String,
    image: String,
    description: String
  }],
  // Statistics
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  // SEO
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
servicePackageSchema.index({ freelancerId: 1, category: 1 });
servicePackageSchema.index({ tags: 1 });
servicePackageSchema.index({ 'stats.averageRating': -1 });

const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema);

export default ServicePackage;
