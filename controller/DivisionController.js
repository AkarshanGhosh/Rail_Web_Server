const Division = require("../models/Division.js");  // Ensure the path is correct
const userModel = require("../models/User.js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Add division --admin
module.exports.addDivision = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header is missing. Please log in again." });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing. Please log in again." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const user = await userModel.findById(userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to add divisions" });
        }

        const { division, states, cities, train_Name, train_number } = req.body;

        // Check if division with the same data already exists
        const existingDivision = await Division.findOne({
            division,
            states,
            cities,
            train_Name,
            train_number,
        });

        if (existingDivision) {
            return res.status(400).json({ message: "Data already exists" });
        }

        if (!division || !states || !cities || !train_Name || !train_number) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newDivision = new Division({
            division,   // Matches the schema field name
            states,     // Matches the schema field name
            cities,     // Matches the schema field name
            train_Name, // Matches the schema field name
            train_number, // Matches the schema field name
        });

        await newDivision.save();

        res.status(201).json({ message: "Division added successfully", division: newDivision });
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }

        res.status(500).json({ message: "An error occurred while adding the division", error: error.message });
    }
};

// Delete division --admin
module.exports.deleteDivision = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header is missing. Please log in again." });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing. Please log in again." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const user = await userModel.findById(userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to delete divisions" });
        }

        const divisionId = req.headers["division-id"];

        if (!divisionId || !mongoose.Types.ObjectId.isValid(divisionId)) {
            return res.status(400).json({ message: "Invalid Division ID" });
        }

        const division = await Division.findById(divisionId);
        if (!division) {
            return res.status(404).json({ message: "Division not found" });
        }

        await Division.findByIdAndDelete(divisionId);

        res.status(200).json({ message: "Division deleted successfully" });
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }

        res.status(500).json({ message: error.message });
    }
};

// Get all divisions
module.exports.getAllDivisions = async (req, res) => {
    try {
        const divisions = await Division.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: "Success",
            data: divisions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get recently added divisions
module.exports.getRecentlyAddedDivisions = async (req, res) => {
    try {
        const divisions = await Division.find().sort({ createdAt: -1 }).limit(4);

        res.status(200).json({
            status: "Success",
            data: divisions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Get Division by ID
module.exports.getDivisionById = async (req, res) => {
    try {
        // Extract the division ID from the request parameters
        const { id } = req.params;

        // Validate the ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Division ID" });
        }

        // Find the division by ID
        const division = await Division.findById(id);

        // Check if the division exists
        if (!division) {
            return res.status(404).json({ message: "Division not found" });
        }

        // Return the division
        return res.json({
            status: "Success",
            data: division,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


