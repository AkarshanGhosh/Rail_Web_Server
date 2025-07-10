// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controller/ActivityController'); // Adjust path
const userAuth = require('../middleware/UserAuth'); // Your authentication middleware

// Route to get recent activities (Admin only)
// Change from '/activities/recent' to just '/recent'
router.get('/recent', userAuth, activityController.getRecentActivities);

// Example: If you had a route to create an activity
// router.post('/', userAuth, activityController.createActivity);
// Example: If you had a route to get a specific activity by ID
// router.get('/:id', userAuth, activityController.getActivityById);

module.exports = router;