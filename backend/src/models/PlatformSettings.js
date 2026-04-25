import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    platformFeePercentage: { type: Number, default: 3, min: 0, max: 50 },
    escrowEnabled: { type: Boolean, default: true },
    maxProposalsPerJob: { type: Number, default: 20 },
    maxActiveJobsPerClient: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },
    allowNewRegistrations: { type: Boolean, default: true },
    // Risk auto-flag thresholds
    autoFlagReportCount: { type: Number, default: 3 },
    autoFlagRefundCount: { type: Number, default: 3 },
    // Notification settings
    emailNotificationsEnabled: { type: Boolean, default: true },
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;
