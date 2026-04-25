import mongoose from 'mongoose';
import { DEFAULT_CURRENCY } from '../config/currency.js';

const contractSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isHiringRequest: {
    type: Boolean,
    default: false
  },
  offerStatus: {
    type: String,
    enum: ['pending_freelancer', 'accepted', 'rejected'],
    default: 'accepted'
  },
  hiringContext: {
    type: {
      type: String,
      enum: ['individual', 'company'],
      default: 'individual'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    }
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    total: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['hourly', 'fixed'],
      required: true
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY
    }
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    amount: {
      type: Number,
      required: true
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'submitted', 'revision-requested', 'approved', 'paid'],
      default: 'pending'
    },
    submittedAt: Date,
    approvedAt: Date,
    paidAt: Date,
    deliverables: [{
      filename: String,
      url: String,
      uploadedAt: Date
    }],
    feedback: String
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'escrow', 'released', 'refunded', 'disputed'],
    default: 'pending'
  },
  escrowId: String,
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  actualEndDate: Date,
  terms: {
    type: String,
    maxlength: 5000
  },
  signatures: {
    client: {
      signed: Boolean,
      signedAt: Date,
      ipAddress: String
    },
    freelancer: {
      signed: Boolean,
      signedAt: Date,
      ipAddress: String
    }
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  platformFee: {
    percentage: {
      type: Number,
      default: 3
    },
    amount: Number
  },
  refundPolicy: {
    type: String,
    default: 'As per platform terms'
  },
  disputeReason: String,
  disputeResolvedAt: Date,
  // Reports submitted by client or freelancer to admin
  reports: [{
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reporterRole: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Admin escrow hold
  isHeldByAdmin: {
    type: Boolean,
    default: false
  },
  holdReason: String,
  heldAt: Date,
  heldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
contractSchema.index({ clientId: 1, status: 1 });
contractSchema.index({ freelancerId: 1, status: 1 });
contractSchema.index({ status: 1, createdAt: -1 });
// Ensure a proposal can only ever have one contract
contractSchema.index({ proposalId: 1 }, { unique: true, sparse: true });

// Calculate total milestone amount
contractSchema.methods.calculateMilestoneTotal = function() {
  return this.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
};

// Calculate platform fee
contractSchema.methods.calculatePlatformFee = function() {
  const fee = (this.amount.total * this.platformFee.percentage) / 100;
  this.platformFee.amount = fee;
  return fee;
};

const Contract = mongoose.model('Contract', contractSchema);

export default Contract;
