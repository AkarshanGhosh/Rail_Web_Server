const express = require('express');
const userAuth = require('../middleware/UserAuth.js');
const { getUserData } = require( '../controller/UserController.js');

const UserRouter = express.Router();

UserRouter.get('/data', userAuth, getUserData);

module.exports = UserRouter;