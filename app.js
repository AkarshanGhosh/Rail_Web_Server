const express = require('express');
const app = express();
require("dotenv").config();
require("./conn/conn");
const cors = require("cors");

const auth = require("./routes/authRoute.js");
const user = require("./routes/userRoute.js"); 
const divisionRouter = require('./routes/divisionRoute.js');
const trainRouter = require('./routes/trainRoute.js');

// ✅ CORS Configuration - allow all origins, no credentials
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Health check endpoint (important for Render)
app.get("/health", (req, res) => res.status(200).send("OK"));

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/division", divisionRouter);
app.use("/api/coach", trainRouter);

// ✅ Error handler (catches unhandled server errors)
app.use((err, req, res, next) => {
  console.error("❌ Uncaught Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Start server (use Render's dynamic port)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});
