import AdminNotification from '../models/AdminNotification.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user's admin notifications
export const getAdminNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user._id;

    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const total = await AdminNotification.countDocuments(filter);
    const notifications = await AdminNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        unreadCount: await AdminNotification.countDocuments({ userId, isRead: false })
      }
    });
  } catch (err) {
    next(err);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.json({ status: 'success', data: notification });
  } catch (err) {
    next(err);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    await AdminNotification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const unreadCount = await AdminNotification.countDocuments({ userId, isRead: false });

    res.json({
      status: 'success',
      message: 'All notifications marked as read',
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await AdminNotification.findByIdAndDelete(req.params.notificationId);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.json({ status: 'success', message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};
