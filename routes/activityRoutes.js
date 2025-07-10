// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/ActivityController'); // Adjust path
const userAuth = require('../middleware/UserAuth'); // Your authentication middleware

// Route to get recent activities (Admin only)
router.get('/activities/recent', userAuth, activityController.getRecentActivities);

module.exports = router;