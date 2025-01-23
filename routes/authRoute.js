const express = require('express');
const {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    getUserById,
    isAuthenticated,
    verifyEmail,
} = require('../controller/AuthController.js');
const userAuth = require('../middleware/UserAuth.js');

const authRouter = express.Router();

// Authentication Routes
authRouter.post('/register', register); // User registration
authRouter.post('/login', login); // User login
authRouter.post('/logout', logout); // User logout
authRouter.post('/forgot-password', forgotPassword); // Send OTP for password reset
authRouter.post('/reset-password', resetPassword); // Reset password using OTP
authRouter.post('/verify-email', verifyEmail); // Verify email using OTP
authRouter.get('/getuserbyid', userAuth, getUserById); // Fetch user data by ID (protected)
authRouter.post('/is-auth', userAuth, isAuthenticated); // Check if user is authenticated

module.exports = authRouter;
