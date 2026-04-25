import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/notifications.js';

const router = express.Router();

router.use(protect);

// Get user's admin notifications
router.get('/', getAdminNotifications);

// Mark specific notification as read
router.put('/:notificationId/read', markNotificationAsRead);

// Mark all as read
router.put('/mark-all/read', markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;
