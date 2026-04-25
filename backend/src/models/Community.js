import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    restrictedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
      },
    ],
    category: String,
    logo: String,
    coverImage: String,
    tagline: String,
    website: String,
    industry: String,
    isSuspended: { type: Boolean, default: false },
    suspendedReason: String,
  },
  { timestamps: true }
);

const Community = mongoose.model('Community', communitySchema);

export default Community;
