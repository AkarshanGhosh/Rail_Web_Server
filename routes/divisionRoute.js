const express = require("express");


const userAuth = require('../middleware/UserAuth.js');
const { addDivision, deleteDivision, getAllDivisions, getRecentlyAddedDivisions, getDivisionById,  } = require("../controller/DivisionController.js");


const divisionRouter = express.Router();
//Division routes
divisionRouter.post('/add-division', addDivision, userAuth)//add division
divisionRouter.delete('/delete-division/:id', userAuth, deleteDivision);
divisionRouter.get('/get-all-division', getAllDivisions )//fetch all division 
divisionRouter.get('/recent-division', getRecentlyAddedDivisions) //recent division
divisionRouter.get('/division-id/:id', getDivisionById)// get divisions

module.exports = divisionRouter;
