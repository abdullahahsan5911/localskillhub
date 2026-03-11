import Message from '../models/Message.js';
import { AppError } from '../middleware/errorHandler.js';

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastContent: { $first: '$content' },
          lastAt: { $first: '$createdAt' },
          senderId: { $first: '$senderId' },
          receiverId: { $first: '$receiverId' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', req.user._id] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUserId',
          foreignField: '_id',
          as: 'otherUserArr'
        }
      },
      {
        $addFields: {
          otherUser: { $arrayElemAt: ['$otherUserArr', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: { content: '$lastContent', createdAt: '$lastAt' },
          unreadCount: 1,
          'otherUser._id': 1,
          'otherUser.name': 1,
          'otherUser.avatar': 1
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    res.json({ status: 'success', data: { conversations } });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: 1 }); // ascending: oldest first for chat display

    res.json({ status: 'success', data: { messages } });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, conversationId, messageType, attachments, metadata } = req.body;

    const message = await Message.create({
      conversationId: conversationId || `${[req.user.id, receiverId].sort().join('_')}`,
      senderId: req.user.id,
      receiverId,
      content,
      messageType,
      attachments,
      metadata
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('newMessage', message);

    res.status(201).json({ status: 'success', data: { message } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await Message.findByIdAndUpdate(req.params.messageId, {
      isRead: true,
      readAt: Date.now()
    });

    res.json({ status: 'success', message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (message.senderId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    message.content = req.body.content;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    res.json({ status: 'success', data: { message } });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (message.senderId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    message.isDeleted = true;
    message.deletedBy.push(req.user.id);
    await message.save();

    res.json({ status: 'success', message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};
