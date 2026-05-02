import mongoose from 'mongoose';

const productReplySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const productCommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [productReplySchema],
  },
  { timestamps: true }
);

const productReactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'celebrate', 'support', 'insightful'],
      default: 'like',
    },
  },
  { timestamps: true }
);

const communityProductSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
    },
    title: String,
    description: String,
    price: String,
    images: [String],
    links: [String],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [productReactionSchema],
    comments: [productCommentSchema],
    commentsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const CommunityProduct = mongoose.model('CommunityProduct', communityProductSchema);

export default CommunityProduct;