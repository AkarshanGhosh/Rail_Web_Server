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

        const { division, states, cities, train_name, train_number } = req.body; // ✅ FIXED: Corrected casing for train_number

        // Check if division with the same data already exists
        const existingDivision = await Division.findOne({
            division,
            states,
            cities,
            train_name,
            train_number,
        });

        if (existingDivision) {
            return res.status(400).json({ message: "Data already exists" });
        }

        if (!division || !states || !cities || !train_name || !train_number) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newDivision = new Division({
            division,   
            states,     
            cities,     
            train_name, // ✅ FIXED: Matches the schema field name
            train_number, // ✅ FIXED: Matches the schema field name
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
