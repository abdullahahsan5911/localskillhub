import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkBannedOrSuspended } from '../middleware/checkBan.js';
import { checkRiskForMessaging } from '../middleware/checkRiskLevel.js';
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
router.post('/', checkBannedOrSuspended, checkRiskForMessaging, sendMessage);
router.put('/:messageId/read', markAsRead);
router.put('/:messageId', checkBannedOrSuspended, editMessage);
router.delete('/:messageId', checkBannedOrSuspended, deleteMessage);

export default router;
