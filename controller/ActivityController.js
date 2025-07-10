// controllers/ActivityController.js
const ActivityLog = require('../models/ActivityLog');
const userModel = require('../models/User.js'); // For authentication
const jwt = require('jsonwebtoken'); // For authentication

module.exports.getRecentActivities = async (req, res) => {
    try {
        // --- Admin Authentication & Authorization (similar to other admin routes) ---
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header is missing." });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decodedToken.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to view activities." });
        }
        // --- End Authentication ---

        const limit = parseInt(req.query.limit) || 5; // Get limit from query, default to 5
        const activities = await ActivityLog.find()
            .sort({ timestamp: -1 }) // Sort by latest first
            .limit(limit); // Limit the number of results

        res.status(200).json({ success: true, data: activities });

    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }
        console.error("Error fetching recent activities:", error);
        res.status(500).json({ message: "Failed to fetch recent activities.", error: error.message });
    }
};