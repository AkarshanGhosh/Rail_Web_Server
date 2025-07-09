const express = require('express');
const app = express();

// ✅ Load environment variables first
require("dotenv").config();

// ✅ Database connection with error handling
const connectDB = async () => {
  try {
    await require("./conn/conn");
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

const cors = require("cors");

// Import routes
const auth = require("./routes/authRoute.js");
const user = require("./routes/userRoute.js");
const divisionRouter = require('./routes/divisionRoute.js');
const trainRouter = require('./routes/trainRoute.js');

// ✅ CORS Configuration - optimized for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*' 
    : '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

// ✅ Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ Health check endpoint (required for Render)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "API is running successfully",
    version: "1.0.0",
    endpoints: ["/api/auth", "/api/user", "/api/division", "/api/coach"]
  });
});

// ✅ API Routes
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/division", divisionRouter);
app.use("/api/coach", trainRouter);

// ✅ 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method 
  });
});

// ✅ Global error handler (must be last middleware)
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
      ? "Something went wrong!" 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ✅ Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// ✅ Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server on Render's dynamic port
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      process.exit(1);
    });

    // Make server available for graceful shutdown
    global.server = server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ✅ Start the application
startServer();