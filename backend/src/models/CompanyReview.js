import mongoose from 'mongoose';

const companyReviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewComment: String,
    approvalDate: Date,
    rejectionDate: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

// Prevent duplicate reviews - only one per company at a time
companyReviewSchema.index({ companyId: 1 }, { unique: true });

const CompanyReview = mongoose.model('CompanyReview', companyReviewSchema);

export default CompanyReview;
