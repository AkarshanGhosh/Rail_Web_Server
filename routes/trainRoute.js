const express = require('express');
const { addTrainDetails, getTrainDetails, getAvailableCoaches } = require('../controller/TrainController');

const trainRouter = express.Router();

//Routes

trainRouter.post('/add-coach-data', addTrainDetails)
trainRouter.post('/get-coach-data', getTrainDetails)
trainRouter.post('/get-coach', getAvailableCoaches)


module.exports = trainRouter;
