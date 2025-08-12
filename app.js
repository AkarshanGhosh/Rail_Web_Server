// app.js
const express = require('express');
const app = express();

// ✅ Load environment variables first
require("dotenv").config();

const cors = require("cors");

// ✅ Robust database connection with retries
const connectDB = async () => {
 const maxRetries = 5;
 let retryCount = 0;

 while (retryCount < maxRetries) {
  try {
   console.log(`🔄 Attempting database connection (attempt ${retryCount + 1}/${maxRetries})`);
   await require("./conn/conn");
   console.log("✅ Database connected successfully");
   return;
  } catch (error) {
   retryCount++;
   console.error(`❌ Database connection failed (attempt ${retryCount}/${maxRetries}):`, error.message);

   if (retryCount === maxRetries) {
    console.error("💥 Max database connection retries reached. Exiting...");
    process.exit(1);
   }

   // Wait before retry (exponential backoff)
   await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
  }
 }
};

// Import routes with error handling
let auth, user, divisionRouter, trainRouter, activityRouter;
try {
 auth = require("./routes/authRoute.js");
 user = require("./routes/userRoute.js");
 divisionRouter = require('./routes/divisionRoute.js');
 trainRouter = require('./routes/trainRoute.js');
 activityRouter = require('./routes/activityRoutes.js'); // <--- Already here
 console.log("✅ All routes loaded successfully");
} catch (error) {
 console.error("❌ Route loading failed:", error.message);
 process.exit(1);
}

// ✅ CORS Configuration
const corsOptions = {
 origin: process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : '*')
  : '*',
 credentials: false,
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
 optionsSuccessStatus: 200
};

// ✅ Middleware with error handling
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Request logging
app.use((req, res, next) => {
 console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
 next();
});

// ✅ Enhanced health check with database test
app.get("/health", async (req, res) => {
 try {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const healthInfo = {
   status: "OK",
   timestamp: new Date().toISOString(),
   uptime: Math.floor(process.uptime()),
   memory: {
    rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
   },
   database: dbStatus,
   environment: process.env.NODE_ENV || 'development'
  };

  if (dbStatus === "disconnected") {
   res.status(503).json(healthInfo);
  } else {
   res.status(200).json(healthInfo);
  }
 } catch (error) {
  console.error("❌ Health check failed:", error.message);
  res.status(503).json({
   status: "ERROR",
   timestamp: new Date().toISOString(),
   database: "disconnected",
   error: error.message
  });
 }
});

// ✅ Root endpoint with service info
app.get("/", (req, res) => {
 res.status(200).json({
  message: "🚂 Rail API is running successfully",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  endpoints: {
   auth: "/api/auth",
   user: "/api/user",
   division: "/api/division",
   coach: "/api/coach",
   activities: "/api/activities" // <--- Already here
  },
  health: "/health"
 });
});

// ✅ API Routes with error boundaries
app.use("/api/auth", (req, res, next) => {
 try {
  auth(req, res, next);
 } catch (error) {
  console.error("❌ Auth route error:", error);
  res.status(500).json({ error: "Auth service error" });
 }
});

app.use("/api/user", (req, res, next) => {
 try {
  user(req, res, next);
 } catch (error) {
  console.error("❌ User route error:", error);
  res.status(500).json({ error: "User service error" });
 }
});

app.use("/api/division", (req, res, next) => {
 try {
  divisionRouter(req, res, next);
 } catch (error) {
  console.error("❌ Division route error:", error);
  res.status(500).json({ error: "Division service error" });
 }
});

app.use("/api/coach", (req, res, next) => {
 try {
  trainRouter(req, res, next);
 } catch (error) {
  console.error("❌ Coach route error:", error);
  res.status(500).json({ error: "Coach service error" });
 }
});

// --- UPDATED NEW ACTIVITY ROUTE HERE ---
app.use("/api/activities", (req, res, next) => { // CHANGED BASE PATH TO '/api/activities'
 try {
  activityRouter(req, res, next);
 } catch (error) {
  console.error("❌ Activity route error:", error);
  res.status(500).json({ error: "Activity service error" });
 }
});
// --- END UPDATED NEW ACTIVITY ROUTE ---


// ✅ 404 handler
app.use("*", (req, res) => {
 res.status(404).json({
  error: "Route not found",
  path: req.originalUrl,
  method: req.method,
  availableRoutes: [
   "/",
   "/health",
   "/api/auth",
   "/api/user",
   "/api/division",
   "/api/coach",
   "/api/activities" // <-- FIX: Changed from '/api/activities/recent'
  ]
 });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
 console.error("❌ Uncaught Error:", {
  message: err.message,
  stack: err.stack,
  path: req.path,
  method: req.method,
  timestamp: new Date().toISOString()
 });

 res.status(err.status || 500).json({
  error: process.env.NODE_ENV === 'production'
   ? "Internal server error"
   : err.message,
  ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
 });
});

// ✅ Process error handlers
process.on('uncaughtException', (error) => {
 console.error('💥 Uncaught Exception:', error);
 process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
 console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
 process.exit(1);
});

// ✅ Graceful shutdown
const gracefulShutdown = (signal) => {
 console.log(`👋 ${signal} received, shutting down gracefully`);
 if (global.server) {
  global.server.close(() => {
   console.log('✅ Process terminated');
   process.exit(0);
  });
 } else {
  process.exit(0);
 }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ✅ Start server with comprehensive error handling
const startServer = async () => {
 try {
  console.log("🚀 Starting server initialization...");

  // Step 1: Connect to database with retries
  await connectDB();

  // Step 2: Start server
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, '0.0.0.0', () => {
   console.log(`✅ Server running on port: ${PORT}`);
   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
   console.log(`📡 Service URL: https://rail-web-server.onrender.com`);
  });

  // Step 3: Server error handling
  server.on('error', (error) => {
   console.error('❌ Server error:', error.message);
   if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
   }
   process.exit(1);
  });

  // Step 4: Make server globally available
  global.server = server;

  // Step 5: Keep-alive (only in production)
  if (process.env.NODE_ENV === 'production') {
   setTimeout(() => {
    console.log('🔄 Keep-alive service will start in 2 minutes');
    setInterval(async () => {
     try {
      const response = await fetch('https://rail-web-server.onrender.com/health');
      console.log(`🏓 Keep-alive: ${response.status}`);
     } catch (error) {
      console.log(`❌ Keep-alive failed: ${error.message}`);
     }
    }, 14 * 60 * 1000); // Every 14 minutes
   }, 2 * 60 * 1000); // Start after 2 minutes
  }

} catch (error) {
 console.error('💥 Failed to start server:', error.message);
 process.exit(1); }
};

// ✅ Initialize application
startServer();