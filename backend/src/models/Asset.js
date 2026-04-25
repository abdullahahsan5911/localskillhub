import mongoose from 'mongoose';
import { DEFAULT_CURRENCY } from '../config/currency.js';

const assetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      index: true,
    },
    tags: [String],
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    previewImages: [String],
    downloads: {
      type: Number,
      default: 0,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    locationSnapshot: {
      city: String,
      state: String,
      country: String,
    },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
