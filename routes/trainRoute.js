const express = require('express');
const { 
      addTrainDetails, 
      getTrainDetails, 
      getAvailableCoaches,
      getActiveChainPulls,
      getChainStatusStats
} = require('../controller/TrainController');
  
const trainRouter = express.Router();

// Existing Routes

// Add train/coach data (POST request)
trainRouter.post('/add-coach-data', addTrainDetails);

// Fetch train details dynamically
trainRouter.get('/get-coach-data', getTrainDetails);

// Fetch available coaches for a train
trainRouter.post('/get-coach', getAvailableCoaches);

// New Routes for Chain Alert System

// Alternative endpoint to get active chain pulls (unique per train-coach combination)
trainRouter.get('/active-chain-pulls', getActiveChainPulls);

// Get chain status statistics for dashboard
trainRouter.get('/chain-stats', getChainStatusStats);

module.exports = trainRouter;
