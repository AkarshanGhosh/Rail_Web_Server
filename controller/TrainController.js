const Train = require("../models/Train"); // Import Train model
const Division = require("../models/Division"); // Import Division model
const User = require("../models/User"); // Import User model
const transporter = require('../config/nodemailer'); // Import pre-configured nodemailer transporter
const logActivity = require('../utils/logger'); // <--- ADD THIS LINE (adjust path)
const jwt = require('jsonwebtoken'); // Needed for decoding token if you want userId for logging

// Function to send an email to all users when chain status is pulled
const sendChainStatusEmail = async (train) => {
    try {
        const emails = await User.find({}, { email: 1, _id: 0 }).then(users => users.map(user => user.email));

        if (emails.length === 0) {
            await logActivity("Chain Status Email: No users found to send the email.", 'info');
            return;
        }

        for (const email of emails) {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "Chain Pulled Notification",
                text: `Alert! The chain status of train "${train.train_Number}" (Coach: ${train.coach}) has been updated to "Pulled". Please take necessary actions immediately.`,
            };
            const info = await transporter.sendMail(mailOptions);
            await logActivity(`Chain Status Email: Sent notification for train ${train.train_Number} to ${email}. Response: ${info.response}`, 'success');
        }
    } catch (error) {
        await logActivity(`Chain Status Email: Error while sending notification for train ${train.train_Number}. Error: ${error.message}`, 'error');
        console.error("Error while sending chain status email:", error);
    }
};

// Add data (Train Details)
// NOTE: You had two identical 'addTrainDetails' exports. I've updated this first one.
// Please remove the duplicate 'addTrainDetails' function from your actual file.
module.exports.addTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach, chain_status, latitude, longitude, temperature, error, memory, humidity, date, time } = req.body;

        // Check if the train number exists in the Division model
        const divisionExists = await Division.findOne({ train_Number });

        if (!divisionExists) {
            await logActivity(`Add Train Details: Train number '${train_Number}' does not exist in Division.`, 'warning');
            return res.status(400).json({ message: "Train number does not exist in Division." });
        }

        // Create a new train entry
        const newTrain = new Train({
            train_Number,
            coach,
            chain_status,
            latitude,
            longitude,
            temperature,
            error,
            memory,
            humidity,
            date,
            time
        });

        const savedTrain = await newTrain.save();

        if (savedTrain.chain_status === "pulled") {
            await sendChainStatusEmail(savedTrain);
        }
        await logActivity(`Added train details for Train: ${train_Number}, Coach: ${coach}, Status: ${chain_status}.`, 'success');
        res.status(201).json({ message: "Train details added successfully!", train: savedTrain });
    } catch (error) {
        await logActivity(`Add Train Details: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};

/*
// DUPLICATE: This is a duplicate of the addTrainDetails function above.
// Please remove one of them from your actual backend files.
module.exports.addTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach, chain_status, latitude, longitude, temperature, error, memory, humidity, date, time } = req.body;

        const divisionExists = await Division.findOne({ train_Number });

        if (!divisionExists) {
            return res.status(400).json({ message: "Train number does not exist in Division." });
        }

        const newTrain = new Train({
            train_Number,
            coach,
            chain_status,
            latitude,
            longitude,
            temperature,
            error,
            memory,
            humidity,
            date,
            time
        });

        const savedTrain = await newTrain.save();

        if (savedTrain.chain_status === "pulled") {
            await sendChainStatusEmail(savedTrain);
        }

        res.status(201).json({ message: "Train details added successfully!", train: savedTrain });
    } catch (error) {
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};
*/


// Fetch train details by train_Number and coach
module.exports.getTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach } = req.query;
        // console.log("Train Number:", train_Number, "Coach:", coach); // Keep for immediate debug, but logs to DB now

        if (!train_Number || !coach) {
            await logActivity(`Get Train Details: Missing train number or coach in query.`, 'warning');
            return res.status(400).json({ message: "Train number and coach are required." });
        }

        const train = await Train.find({ train_Number, coach });

        if (train.length === 0) {
            await logActivity(`Get Train Details: No details found for Train: ${train_Number}, Coach: ${coach}.`, 'info');
            return res.status(404).json({ message: "Train details not found for the given train number and coach." });
        }
        await logActivity(`Fetched train details for Train: ${train_Number}, Coach: ${coach}.`, 'info');
        res.status(200).json({
            message: "Train details fetched successfully!",
            train
        });
    } catch (error) {
        await logActivity(`Get Train Details: An error occurred for Train: ${req.query.train_Number}, Coach: ${req.query.coach}. Error: ${error.message}`, 'error');
        console.error("Error fetching train details:", error);
        res.status(500).json({
            message: "An error occurred while fetching train details",
            error: error.message
        });
    }
};

// Fetch available coaches under the train name or train number
module.exports.getAvailableCoaches = async (req, res) => {
    try {
        const { train_Name, train_Number } = req.body;

        if (!train_Name && !train_Number) {
            await logActivity(`Get Available Coaches: Missing train name or number in request.`, 'warning');
            return res.status(400).json({ message: "Either train name or train number is required." });
        }

        const query = {};
        if (train_Name) {
            query.train_Name = train_Name;
        }
        if (train_Number) {
            query.train_Number = train_Number;
        }

        const trains = await Train.find(query);

        if (trains.length === 0) {
            await logActivity(`Get Available Coaches: No coaches found for Train Name: ${train_Name || 'N/A'}, Train Number: ${train_Number || 'N/A'}.`, 'info');
            return res.status(404).json({ message: "No coaches found for the given train name or number." });
        }

        const coaches = [...new Set(trains.map(train => train.coach))];
        await logActivity(`Fetched available coaches for Train Name: ${train_Name || 'N/A'}, Train Number: ${train_Number || 'N/A'}. Found ${coaches.length} unique coaches.`, 'info');
        res.status(200).json({ message: "Available coaches fetched successfully!", coaches });
    } catch (error) {
        await logActivity(`Get Available Coaches: An error occurred for Train Name: ${req.body.train_Name || 'N/A'}, Train Number: ${req.body.train_Number || 'N/A'}. Error: ${error.message}`, 'error');
        console.error("Error fetching available coaches:", error);
        res.status(500).json({ message: "An error occurred while fetching available coaches", error: error.message });
    }
};