import mongoose from 'mongoose';

const postReplySchema = new mongoose.Schema(
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

const postCommentSchema = new mongoose.Schema(
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
    replies: [postReplySchema],
  },
  { timestamps: true }
);

const postReactionSchema = new mongoose.Schema(
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

const communityPostSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    images: [String],
    links: [String],
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reposts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    repostsCount: { type: Number, default: 0 },
    reactions: [postReactionSchema],
    comments: [postCommentSchema],
    commentsCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

export default CommunityPost;
