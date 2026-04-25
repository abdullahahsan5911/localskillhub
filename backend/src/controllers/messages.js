import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { AppError } from '../middleware/errorHandler.js';

export const getConversations = async (req, res, next) => {
  try {
    // Prefer Conversation collection for metadata; fall back to aggregation
    const userId = req.user._id;

    let conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name avatar');

    let unreadCountMap = {};

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((conv) => conv._id);
      const unreadAgg = await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            receiverId: userId,
            isRead: false,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ]);

      unreadCountMap = unreadAgg.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
    }

    if (!conversations || conversations.length === 0) {
      const agg = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
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
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      conversations = agg.map(doc => ({
        _id: doc._id,
        lastMessage: { content: doc.lastContent, createdAt: doc.lastAt },
        unreadCount: doc.unreadCount,
        participants: [doc.senderId, doc.receiverId]
      }));
    }

    // Shape response similar to previous: include "other user" for direct chats
    const formatted = conversations.map(conv => {
      const isDirect = conv.type === 'group' ? false : true;
      const participants = Array.isArray(conv.participants) ? conv.participants : [];
      const populatedParticipants = participants.filter(
        p => p && typeof p === 'object' && p._id
      );
      const other = isDirect
        ? populatedParticipants.find(p => p._id.toString() !== userId.toString()) || null
        : null;

      return {
        _id: conv._id,
        lastMessage: conv.lastMessage || null,
        unreadCount: unreadCountMap[conv._id] ?? conv.unreadCount ?? 0,
        otherUser: other
          ? { _id: other._id, name: other.name, avatar: other.avatar }
          : null,
        type: conv.type || 'direct'
      };
    });

    res.json({ status: 'success', data: { conversations: formatted } });
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
    const senderId = req.user._id;

    console.log('=== sendMessage DEBUG ===');
    console.log('Received data:', { receiverId, content, conversationId, messageType, attachments, senderId });
    console.log('Content type:', typeof content, 'Content value:', JSON.stringify(content));
    console.log('Attachments:', attachments);
 
    // Validate required fields
    if (!receiverId) {
      console.log('ERROR: No receiverId');
      return next(new AppError('Receiver ID is required', 400));
    }
    
    // Content is optional if attachments are provided
    if (!attachments || attachments.length === 0) {
      console.log('No attachments, checking content...');
      if (!content || !content.trim()) {
        console.log('ERROR: No content and no attachments');
        return next(new AppError('Message content cannot be empty', 400));
      }
      if (content.length > 20000) {
        console.log('ERROR: Content too long');
        return next(new AppError('Message content is too long (max 20000 characters)', 400));
      }
    }

    console.log('Validation passed, creating message...');

    // Determine conversation key (string) for backward compatibility
    const convId =
      conversationId || `${[senderId.toString(), receiverId.toString()].sort().join('_')}`;

    // Ensure Conversation document exists and update metadata
    const participants = [senderId, receiverId];
    await Conversation.findByIdAndUpdate(
      convId,
      {
        _id: convId,
        $setOnInsert: {
          type: 'direct'
        },
        $addToSet: { participants: { $each: participants } },
        lastMessage: {
          content,
          senderId,
          createdAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const message = await Message.create({
      conversationId: convId,
      senderId,
      receiverId,
      content: content ? content.trim() : '',
      messageType: messageType || (attachments && attachments.length > 0 ? 'file' : 'text'),
      attachments,
      metadata
    });

    console.log('Message created successfully:', message._id);

    // Emit socket event
    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('newMessage', message);

    res.status(201).json({ status: 'success', data: { message } });
  } catch (error) {
    console.error('=== sendMessage ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors).map(k => ({
        field: k,
        message: error.errors[k].message
      })));
    }
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
    
    if (message.senderId.toString() !== req.user._id.toString()) {
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
    
    if (message.senderId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    message.isDeleted = true;
    message.deletedBy.push(req.user._id);
    await message.save();

    res.json({ status: 'success', message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};
