const express = require('express');
const { addTrainDetails, getTrainDetails, getAvailableCoaches } = require('../controller/TrainController');

const trainRouter = express.Router();

//Routes

trainRouter.post('/add-coach-data', addTrainDetails)
trainRouter.get('/get-coach-data', getTrainDetails)
trainRouter.get('/get-coach', getAvailableCoaches)


module.exports = trainRouter;
