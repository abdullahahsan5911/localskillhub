import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import User from '../models/User.js';

// Middleware to authenticate users but allow banned users (for appeal endpoints)
export const protectAllowBanned = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return next(new AppError('User not found', 404));
      }

      // NOTE: Allow deactivated accounts for banned users submitting appeals
      // Deactivated is a flag used when users are banned, so we skip this check here
      // if (!req.user.isActive) {
      //   return next(new AppError('User account is deactivated', 403));
      // }

      // NOTE: Intentionally skipping ban check here to allow banned users to submit appeals
      // Banned users can only access appeal endpoints with this middleware

      // Check if user is suspended
      if (req.user.isSuspended) {
        // Check if suspension has expired
        if (req.user.suspendedUntil && new Date(req.user.suspendedUntil) < new Date()) {
          // Auto-reinstate the user
          req.user.isSuspended = false;
          req.user.suspendedUntil = null;
          await req.user.save();
        } else {
          const suspendedUntil = req.user.suspendedUntil 
            ? new Date(req.user.suspendedUntil).toLocaleDateString()
            : 'unknown';
          return next(new AppError(`Your account is suspended until ${suspendedUntil}`, 403));
        }
      }

      next();
    } catch (err) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (err) {
    next(err);
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return next(new AppError('User not found', 404));
      }

      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 403));
      }

      // Check if user is banned
      if (req.user.isBanned) {
        return next(new AppError('Your account has been banned. Please contact support.', 403));
      }

      // Check if user is suspended
      if (req.user.isSuspended) {
        // Check if suspension has expired
        if (req.user.suspendedUntil && new Date(req.user.suspendedUntil) < new Date()) {
          // Auto-reinstate the user
          req.user.isSuspended = false;
          req.user.suspendedUntil = null;
          await req.user.save();
        } else {
          const suspendedUntil = req.user.suspendedUntil 
            ? new Date(req.user.suspendedUntil).toLocaleDateString()
            : 'indefinitely';
          return next(new AppError(`Your account is suspended until ${suspendedUntil}`, 403));
        }
      }

      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Check if user has specific role (admin is always allowed)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role ${req.user.role} is not authorized to access this route`, 403)
      );
    }

    next();
  };
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-passwordHash');
      } catch (error) {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
