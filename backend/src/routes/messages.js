import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  editMessage
} from '../controllers/messages.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:messageId/read', markAsRead);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
