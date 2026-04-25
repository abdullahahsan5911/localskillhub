import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PlatformSettings from '../models/PlatformSettings.js';

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Explicitly allow auth routes so admins can log in and out
    if (req.path.startsWith('/api/auth')) {
      return next();
    }
    
    // Explicitly allow admin settings route so they can turn it off
    if (req.path.startsWith('/api/admin/settings')) {
        return next();
    }

    // Always fetch settings to check if maintenance is enabled
    const settings = await PlatformSettings.findOne();
    if (!settings || !settings.maintenanceMode) {
      return next();
    }

    // If maintenance is enabled, we need to allow admins through.
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role');
        if (user && user.role === 'admin') {
          return next();
        }
      } catch (err) {
        // Token is invalid or expired, ignore and proceed to block
      }
    }

    // If not an admin, block the request
    return res.status(503).json({
      status: 'error',
      code: 'MAINTENANCE_MODE',
      message: settings.maintenanceMessage || 'Platform is currently under maintenance. Please try again later.',
    });
  } catch (err) {
    next(err);
  }
};
