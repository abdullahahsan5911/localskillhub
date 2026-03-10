import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    maxlength: 2000
  },
  proposedRate: {
    amount: {
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
      default: 'USD'
    }
  },
  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months']
    }
  },
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    deliveryDate: Date
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['sent', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'sent'
  },
  negotiationHistory: [{
    by: {
      type: String,
      enum: ['client', 'freelancer']
    },
    message: String,
    proposedAmount: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewedAt: Date,
  respondedAt: Date,
  isInvited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
proposalSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ status: 1 });
proposalSchema.index({ freelancerId: 1, status: 1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
