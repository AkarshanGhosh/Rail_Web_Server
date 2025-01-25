const express = require('express');
const { addTrainDetails, getTrainDetails, getAvailableCoaches } = require('../controller/TrainController');

const trainRouter = express.Router();

// Routes

// Add train/coach data (POST request remains unchanged)
trainRouter.post('/add-coach-data', addTrainDetails);

// Fetch train details dynamically (updated to GET with query parameters)
trainRouter.get('/get-coach-data', getTrainDetails);

// Fetch available coaches for a train (can remain POST if required)
trainRouter.post('/get-coach', getAvailableCoaches);

module.exports = trainRouter;
