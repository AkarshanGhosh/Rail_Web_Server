const express = require("express");

const userAuth = require('../middleware/UserAuth.js');
const { 
    addDivision, 
    modifyDivision,
    deleteDivision, 
    getAllDivisions, 
    getRecentlyAddedDivisions, 
    getDivisionById,
    addCoachToDivision,
    removeCoachFromDivision
} = require("../controller/DivisionController.js");

const divisionRouter = express.Router();

// Division routes
divisionRouter.post('/add-division', userAuth, addDivision); // add division
divisionRouter.put('/modify-division/:id', userAuth, modifyDivision); // modify/update division
divisionRouter.delete('/delete-division/:id', userAuth, deleteDivision); // delete division
divisionRouter.get('/get-all-division', getAllDivisions); // fetch all division 
divisionRouter.get('/recent-division', getRecentlyAddedDivisions); // recent division
divisionRouter.get('/division-id/:id', getDivisionById); // get division by id

// Coach management routes
divisionRouter.post('/division/:id/add-coach', userAuth, addCoachToDivision); // add coach to division
divisionRouter.delete('/division/:id/remove-coach/:uid', userAuth, removeCoachFromDivision); // remove coach from division

module.exports = divisionRouter;