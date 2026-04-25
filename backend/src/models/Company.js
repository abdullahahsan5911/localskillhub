import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    description: String,
    industry: String,
    website: String,
    location: {
      city: String,
      state: String,
      country: String,
    },
    logo: String,
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified',
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Company = mongoose.model('Company', companySchema);

export default Company;
