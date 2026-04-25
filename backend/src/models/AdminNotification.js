import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'job_flagged', 'job_deleted', 'job_featured', 'job_unfeatured',
      'account_warning', 'account_suspended',
      'contract_report',
      'hire_request_sent', 'hire_request_accepted', 'hire_request_rejected',
      'payment_held', 'payment_unhold', 'payment_released', 'payment_refunded',
      'escrow_held_by_admin',
      'withdrawal_initiated',
      'verification_approved', 'verification_rejected'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger'],
    default: 'info'
  },
  icon: String,
  
  // Related entity info
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  jobTitle: String,
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  contractTitle: String,
  reason: String,
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, { timestamps: true });

// Index for efficient queries
adminNotificationSchema.index({ userId: 1, createdAt: -1 });
adminNotificationSchema.index({ userId: 1, isRead: 1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification;
