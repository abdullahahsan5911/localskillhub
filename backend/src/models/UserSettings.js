import mongoose from 'mongoose';
import { DEFAULT_CURRENCY } from '../config/currency.js';

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    privacy: {
      profileVisibility: { type: String, default: 'public' },
      showEarnings: { type: Boolean, default: false },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
    },
    billing: {
      defaultCurrency: { type: String, default: DEFAULT_CURRENCY },
    },
  },
  { timestamps: true }
);

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;
