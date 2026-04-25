import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        // User
        'BAN_USER', 'UNBAN_USER', 'SUSPEND_USER', 'ACTIVATE_USER', 'WARN_USER',
        'SET_RISK_LEVEL', 'ASSIGN_BADGE', 'REMOVE_BADGE', 'CHANGE_ROLE', 'ADD_ADMIN_NOTE',
        // Verification
        'APPROVE_VERIFICATION', 'REJECT_VERIFICATION', 'REQUEST_REUPLOAD',
        // Jobs
        'FLAG_JOB', 'UNFLAG_JOB', 'FEATURE_JOB', 'DELETE_JOB',
        // Contracts
        'FORCE_RELEASE_ESCROW', 'REFUND_CLIENT', 'FREEZE_CONTRACT', 'RESOLVE_DISPUTE', 'ADJUST_FEE',
        // Reviews
        'DELETE_REVIEW', 'FLAG_REVIEW',
        // Reputation
        'ADJUST_REPUTATION_SCORE',
        // Community
        'DELETE_COMMUNITY', 'SUSPEND_COMMUNITY', 'RESTORE_COMMUNITY',
        // Settings
        'UPDATE_SETTINGS',
        // Dispute
        'OPEN_DISPUTE', 'UPDATE_DISPUTE', 'CLOSE_DISPUTE'
      ]
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetType: {
      type: String,
      enum: ['user', 'job', 'contract', 'review', 'verification', 'reputation', 'community', 'settings', 'dispute']
    },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetId: 1, targetType: 1 });
adminActionSchema.index({ actionType: 1 });
adminActionSchema.index({ createdAt: -1 });

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

export default AdminAction;
