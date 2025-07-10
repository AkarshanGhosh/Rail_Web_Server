const Division = require("../models/Division.js"); // Ensure the path is correct
const userModel = require("../models/User.js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const logActivity = require('../utils/logger'); // <--- ADD THIS LINE (adjust path if your logger.js is elsewhere)

// Add division --admin
module.exports.addDivision = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            await logActivity("Add Division: Authorization header missing.", 'warning');
            return res.status(401).json({ message: "Authorization header is missing. Please log in again." });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            await logActivity("Add Division: Authorization token missing.", 'warning');
            return res.status(401).json({ message: "Authorization token is missing. Please log in again." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const user = await userModel.findById(userId);
        if (!user || user.role !== "admin") {
            await logActivity(`Add Division: Unauthorized attempt by user ID ${userId}.`, 'warning', userId);
            return res.status(403).json({ message: "You are not authorized to add divisions" });
        }

        const { division, states, cities, train_Name, train_Number } = req.body;

        // Check if division with the same data already exists
        const existingDivision = await Division.findOne({
            division,
            states,
            cities,
            train_Name,
            train_Number,
        });

        if (existingDivision) {
            await logActivity(`Add Division: Attempted to add existing train '${train_Name}' (#${train_Number}).`, 'info', userId);
            return res.status(400).json({ message: "Data already exists" });
        }

        if (!division || !states || !cities || !train_Name || !train_Number) {
            await logActivity(`Add Division: Missing required fields by user ID ${userId}.`, 'warning', userId);
            return res.status(400).json({ message: "All fields are required" });
        }

        const newDivision = new Division({
            division,
            states,
            cities,
            train_Name,
            train_Number,
        });

        await newDivision.save();
        await logActivity(`Admin added new train: '${train_Name}' (#${train_Number}).`, 'success', userId);
        res.status(201).json({ message: "Division added successfully", division: newDivision });
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            await logActivity(`Add Division: Invalid token. Error: ${error.message}`, 'error');
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }
        await logActivity(`Add Division: An error occurred. Error: ${error.message}`, 'error', req.userId); // Assuming userId might be available from middleware for error logging
        console.error("Error adding division:", error);
        res.status(500).json({ message: "An error occurred while adding the division", error: error.message });
    }
};

// Delete division (which is a train) --admin
module.exports.deleteDivision = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            await logActivity("Delete Division: Authorization header missing.", 'warning');
            return res.status(401).json({ message: "Authorization header is missing. Please log in again." });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            await logActivity("Delete Division: Authorization token missing.", 'warning');
            return res.status(401).json({ message: "Authorization token is missing. Please log in again." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const user = await userModel.findById(userId);
        if (!user || user.role !== "admin") {
            await logActivity(`Delete Division: Unauthorized attempt by user ID ${userId}.`, 'warning', userId);
            return res.status(403).json({ message: "You are not authorized to delete divisions" });
        }

        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            await logActivity(`Delete Division: Invalid ID format '${id}' provided by user ID ${userId}.`, 'warning', userId);
            return res.status(400).json({ message: "Invalid Division ID provided. Must be a valid MongoDB ObjectId." });
        }

        const division = await Division.findById(id);
        if (!division) {
            await logActivity(`Delete Division: Attempted to delete non-existent train with ID '${id}' by user ID ${userId}.`, 'warning', userId);
            return res.status(404).json({ message: "Division (Train) not found." });
        }

        await Division.findByIdAndDelete(id);
        await logActivity(`Admin deleted train: '${division.train_Name}' (#${division.train_Number}) with ID '${id}'.`, 'success', userId);
        res.status(200).json({ message: "Division (Train) deleted successfully." });
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            await logActivity(`Delete Division: Invalid token. Error: ${error.message}`, 'error');
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }
        if (error.name === 'CastError' && error.path === '_id') {
            await logActivity(`Delete Division: CastError for ID '${req.params.id}'. Error: ${error.message}`, 'error', req.userId);
            return res.status(400).json({ message: "Invalid Division ID format." });
        }
        await logActivity(`Delete Division: An error occurred while deleting train ID '${req.params.id}'. Error: ${error.message}`, 'error', req.userId);
        console.error("Error deleting division:", error);
        res.status(500).json({ message: "An error occurred while deleting the division (train).", error: error.message });
    }
};

// Get all divisions
module.exports.getAllDivisions = async (req, res) => {
    try {
        const divisions = await Division.find().sort({ createdAt: -1 });
        await logActivity("Fetched all divisions (trains).", 'info'); // This is a public endpoint, no userId
        res.status(200).json({
            status: "Success",
            data: divisions,
        });
    } catch (error) {
        await logActivity(`Get All Divisions: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error fetching all divisions:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get recently added divisions
module.exports.getRecentlyAddedDivisions = async (req, res) => {
    try {
        const divisions = await Division.find().sort({ createdAt: -1 }).limit(4);
        await logActivity("Fetched recently added divisions (trains).", 'info');
        res.status(200).json({
            status: "Success",
            data: divisions,
        });
    } catch (error) {
        await logActivity(`Get Recently Added Divisions: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error fetching recently added divisions:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get Division by ID
module.exports.getDivisionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            await logActivity(`Get Division by ID: Invalid ID format '${id}' provided.`, 'warning');
            return res.status(400).json({ message: "Invalid Division ID" });
        }

        const division = await Division.findById(id);

        if (!division) {
            await logActivity(`Get Division by ID: Division with ID '${id}' not found.`, 'info');
            return res.status(404).json({ message: "Division not found" });
        }
        await logActivity(`Fetched division '${division.train_Name}' (#${division.train_Number}) by ID '${id}'.`, 'info');
        return res.json({
            status: "Success",
            data: division,
        });
    } catch (error) {
        if (error.name === 'CastError' && error.path === '_id') {
            await logActivity(`Get Division by ID: CastError for ID '${req.params.id}'. Error: ${error.message}`, 'error');
            return res.status(400).json({ message: "Invalid Division ID format." });
        }
        await logActivity(`Get Division by ID: An error occurred for ID '${req.params.id}'. Error: ${error.message}`, 'error');
        console.error("Error fetching division by ID:", error);
        return res.status(500).json({ message: error.message });
    }
};