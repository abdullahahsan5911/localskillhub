import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    raisedByRole: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 2000
    },
    description: {
      type: String,
      maxlength: 5000
    },
    evidence: [{
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fileUrl: String,
      filename: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open'
    },
    resolution: {
      type: {
        type: String,
        enum: ['full_release', 'full_refund', 'partial_split']
      },
      freelancerAmount: Number,
      clientAmount: Number,
      notes: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date
    },
    adminNotes: String,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Stripe chargeback tracking
    stripeDisputeId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

disputeSchema.index({ contractId: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ raisedBy: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
