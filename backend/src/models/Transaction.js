import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Financial amounts are always expressed in platform currency units (e.g. USD)
    // amount               -> job price (what the contract is worth)
    // platformFee          -> platform commission taken from the job price
    // netAmount            -> freelancer earnings (job price - platform fee)
    // processingFee        -> extra fee charged to the client on top of job price
    // clientTotal          -> amount actually charged to the client (job price + processingFee)
    // estimatedProcessingFee -> what we expected to charge before payment (estimate)
    // actualStripeFee        -> what Stripe actually charged us as processing cost
    amount: Number,
    platformFee: Number,
    netAmount: Number,
    processingFee: Number,
    clientTotal: Number,
    estimatedProcessingFee: {
      type: Number,
      default: 0,
    },
    actualStripeFee: {
      type: Number,
      default: 0,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeChargeId: String,
    stripeTransferId: String,
    payoutStatus: {
      type: String,
      enum: ['pending', 'requested', 'processing', 'paid_out', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded', 'partial_refund'],
      default: 'pending',
    },
    // Refund tracking
    refundId: String,
    refundedAt: Date,
    refundReason: String,
    // Partial refund tracking (for partial_split resolution)
    partialRefundId: String,
    partialRefundAmount: Number,
    partialRefundedAt: Date,
    // Dispute resolution tracking
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
