const express = require("express");


const userAuth = require('../middleware/UserAuth.js');
const { addDivision, deleteDivision, getAllDivisions, getRecentlyAddedDivisions } = require("../controller/DivisionController.js");


const divisionRouter = express.Router();
//Division routes
divisionRouter.post('/add-division', addDivision, userAuth)//add division
divisionRouter.post('/delete-division', userAuth, deleteDivision )//delete division
divisionRouter.get('/get-all-division', getAllDivisions )//fetch all division 
divisionRouter.get('/recent-division', getRecentlyAddedDivisions) //recent division

module.exports = divisionRouter;
