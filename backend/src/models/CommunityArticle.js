import mongoose from 'mongoose';

const articleReplySchema = new mongoose.Schema(
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

const articleCommentSchema = new mongoose.Schema(
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
    replies: [articleReplySchema],
  },
  { timestamps: true }
);

const articleReactionSchema = new mongoose.Schema(
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

const communityArticleSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
    },
    title: String,
    content: String,
    images: [String],
    links: [String],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [articleReactionSchema],
    comments: [articleCommentSchema],
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

const CommunityArticle = mongoose.model('CommunityArticle', communityArticleSchema);

export default CommunityArticle;