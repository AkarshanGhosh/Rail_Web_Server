const express = require('express');
const app = express();
require("dotenv").config();
require("./conn/conn");
const cors = require("cors");

const auth = require("./routes/authRoute.js");
const user = require("./routes/userRoute.js"); 
const divisionRouter = require('./routes/divisionRoute.js');
const trainRouter = require('./routes/trainRoute.js');

// CORS Configuration - Fix for credentials: 'include'
const corsOptions = {
  origin: '*', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/division", divisionRouter);
app.use("/api/coach", trainRouter);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running at: http://localhost:${PORT}`);
});