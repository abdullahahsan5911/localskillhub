import rateLimit from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // allow faster iteration locally, stay strict in production
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true,
});

// OTP rate limiter (more lenient - allows polling for verification status)
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 100, // Keep production protected; effectively unbounded for local debugging
  skip: () => isDevelopment,
  message: {
    status: 'error',
    message: 'Too many OTP requests, please try again later'
  },
  skipSuccessfulRequests: false, // Count all requests (including successful ones)
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    status: 'error',
    message: 'Too many uploads, please try again later'
  }
});
