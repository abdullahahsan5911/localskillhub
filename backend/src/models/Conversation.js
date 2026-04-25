import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    // Use string IDs so we can keep existing conversationId room keys
    _id: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    lastMessage: {
      content: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: Date,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

conversationSchema.index({ 'participants': 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
