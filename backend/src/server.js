import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocketIO } from './socket/index.js';

// Import Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import freelancerRoutes from './routes/freelancers.js';
import jobRoutes from './routes/jobs.js';
import proposalRoutes from './routes/proposals.js';
import contractRoutes from './routes/contracts.js';
import messageRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';
import verificationRoutes from './routes/verification.js';
import communityRoutes from './routes/community.js';
import analyticsRoutes from './routes/analytics.js';
import verificationNewRoutes from './routes/verificationRoutes.js';
import geolocationRoutes from './routes/geolocationRoutes.js';
import uploadRoutes from './routes/upload.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Connect to Redis (optional - will continue without it if not configured)
connectRedis();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Make io accessible to routes
app.set('io', io);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'LocalSkillHub API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      freelancers: '/api/freelancers',
      jobs: '/api/jobs',
      proposals: '/api/proposals',
      contracts: '/api/contracts',
      messages: '/api/messages',
      reviews: '/api/reviews',
      verification: '/api/verification',
      verificationV2: '/api/verify',
      geolocation: '/api/geo',
      community: '/api/community',
      analytics: '/api/analytics'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'LocalSkillHub API is running',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/verify', verificationNewRoutes); // New verification system
app.use('/api/geo', geolocationRoutes); // Geo-location features
app.use('/api/community', communityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found' 
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Socket.IO initialized`);
});

export { io };
