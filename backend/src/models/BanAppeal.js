import mongoose from 'mongoose';

const banAppealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    banDate: {
      type: Date,
      required: true
    },
    banReason: {
      type: String,
      required: true
    },
    banAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealMessage: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reopen'],
      default: 'pending',
      index: true
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminReview: String,
    lastAppealAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for queries
banAppealSchema.index({ userId: 1, status: 1 });
banAppealSchema.index({ createdAt: -1 });

// Only one pending appeal per user
banAppealSchema.index({ userId: 1, status: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { status: 'pending' }
});

export default mongoose.model('BanAppeal', banAppealSchema);
