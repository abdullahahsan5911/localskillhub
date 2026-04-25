import { AppError } from './errorHandler.js';

/**
 * Middleware: Check if user is banned and prevent actions
 * Should be used on endpoints where banned users cannot perform actions
 */
export const checkBanned = (req, res, next) => {
  if (req.user && req.user.isBanned) {
    return next(new AppError(
      'Your account has been banned. You can only view your appeal status and submit appeals.',
      403
    ));
  }
  next();
};

/**
 * Middleware: Check if user is banned or suspended
 * Should be used on endpoints where banned/suspended users cannot act
 */
export const checkBannedOrSuspended = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.isBanned) {
    return next(new AppError(
      'Your account has been banned. You can only appeal.',
      403
    ));
  }

  if (req.user.isSuspended) {
    const now = new Date();
    if (req.user.suspendedUntil && new Date(req.user.suspendedUntil) > now) {
      const daysLeft = Math.ceil((new Date(req.user.suspendedUntil) - now) / (1000 * 60 * 60 * 24));
      return next(new AppError(
        `Your account is suspended until ${new Date(req.user.suspendedUntil).toLocaleDateString()}. Days remaining: ${daysLeft}`,
        403
      ));
    }
  }

  next();
};

export default checkBanned;
