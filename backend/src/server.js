import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkMaintenanceMode } from "./middleware/maintenance.js";
import { initializeSocketIO } from "./socket/index.js";
import { stripeWebhook } from "./controllers/contracts.js";
import autoApproveVerifications from "./jobs/autoApproveVerifications.js";

// Import Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import freelancerRoutes from "./routes/freelancers.js";
import jobRoutes from "./routes/jobs.js";
import proposalRoutes from "./routes/proposals.js";
import contractRoutes from "./routes/contracts.js";
import messageRoutes from "./routes/messages.js";
import reviewRoutes from "./routes/reviews.js";
import companiesRoutes from "./routes/companies.js";
import communitiesRoutes from "./routes/communities.js";
import analyticsRoutes from "./routes/analytics.js";
import geolocationRoutes from "./routes/geolocationRoutes.js";
import uploadRoutes from "./routes/upload.js";
import assetRoutes from "./routes/assets.js";
import paymentsRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import notificationsRoutes from "./routes/notifications.js";
import appealsRoutes from "./routes/appeals.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Load environment variables
dotenv.config();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Connect to Redis (optional - will continue without it if not configured)
connectRedis();

// Initialize scheduled jobs
if (process.env.VERCEL !== "1") {
  // Run auto-approval job immediately on startup
  autoApproveVerifications().catch((err) =>
    console.error("Error running auto-approve job on startup:", err),
  );

  // Then run it every hour
  setInterval(
    () => {
      autoApproveVerifications().catch((err) =>
        console.error("Error in scheduled auto-approve job:", err),
      );
    },
    60 * 60 * 1000,
  ); // 1 hour

  console.log("📅 Scheduled job: auto-approve verifications (runs every hour)");
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(morgan("dev")); // Logging
app.use(compression()); // Compress responses

// Stripe webhook must receive the raw body, so register this route
// before the JSON body parser middleware.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Standard body parsers for the rest of the app
app.use(express.json({ limit: "10mb" })); // Parse JSON
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Parse cookies

// Check maintenance mode immediately after parsing body/cookies
app.use(checkMaintenanceMode);

// Ensure DB is ready before API handlers run (important for serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Make io accessible to routes
app.set("io", io);

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "LocalSkillHub API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      freelancers: "/api/freelancers",
      jobs: "/api/jobs",
      proposals: "/api/proposals",
      contracts: "/api/contracts",
      messages: "/api/messages",
      reviews: "/api/reviews",
      geolocation: "/api/geo",
      communities: "/api/communities",
      communities: "/api/communities",
      companies: "/api/companies",
      analytics: "/api/analytics",
      assets: "/api/assets",
      payments: "/api/payments",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "LocalSkillHub API is running",
    timestamp: new Date().toISOString(),
    database: "connected",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes); // ✅ Admin Panel
app.use("/api/notifications", notificationsRoutes); // ✅ Personal Admin Notifications
app.use("/api/appeals", appealsRoutes); // ✅ Ban Appeals System
app.use("/api/freelancers", freelancerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/geo", geolocationRoutes); // Geo-location features
app.use("/api/communities", communitiesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/payments", paymentsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start Server (skip in Vercel serverless environment)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(
      `✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`,
    );
    console.log(`📡 Socket.IO initialized`);
  });
}

export { io };
export default app;
