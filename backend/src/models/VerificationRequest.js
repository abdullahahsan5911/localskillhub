import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    type: {
      type: String,
      enum: ['identity', 'freelancer', 'company', 'github', 'verified_badge'],
      required: true,
    },
    autoApproveAt: {
      type: Date,
      description: 'Timestamp when verification should auto-approve if not reviewed'
    },
    autoApproved: {
      type: Boolean,
      default: false,
      description: 'Whether this was auto-approved due to 1-day timeout'
    },
    documents: [String],
    submittedData: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

export default VerificationRequest;
