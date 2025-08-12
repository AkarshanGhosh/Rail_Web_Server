const Train = require("../models/Train"); // Import Train model
const Division = require("../models/Division"); // Import Division model
const User = require("../models/User"); // Import User model
const transporter = require('../config/nodemailer'); // Import pre-configured nodemailer transporter
const logActivity = require('../utils/logger'); // <--- ADD THIS LINE (adjust path)
const jwt = require('jsonwebtoken'); // Needed for decoding token if you want userId for logging

// In-memory store to track which alerts have been sent to frontend
const sentAlerts = new Set();

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
        }
    } catch (error) {
        await logActivity(`Chain Status Email: Error while sending notification for train ${train.train_Number}. Error: ${error.message}`, 'error');
        console.error("Error while sending chain status email:", error);
    }
};

// Add data (Train Details)
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
        
        // This is the new, direct alert data, now with `createdAt`
        const alert = {
            _id: savedTrain._id, // Add _id for key prop on frontend
            train_Name: divisionExists.train_Name,
            train_Number: savedTrain.train_Number,
            coach: savedTrain.coach,
            createdAt: savedTrain.createdAt, // Include the timestamp
            location: {
                latitude: savedTrain.latitude,
                longitude: savedTrain.longitude
            }
        };

        let responseMessage = { 
            message: "Train details added successfully!", 
            train: savedTrain,
            alert: null // Initialize alert to null
        };
        
        // Check if the chain was pulled AND if this is the first time for this train/coach
        if (savedTrain.chain_status === "pulled") {
            // Find any previous "pulled" records for this specific train and coach
            const previousPull = await Train.findOne({ 
                train_Number, 
                coach,
                chain_status: "pulled",
                _id: { $ne: savedTrain._id } // Exclude the current record
            });

            // If this is the first pull, send the email alert and log it once
            if (!previousPull) {
                await sendChainStatusEmail(savedTrain);
                responseMessage.alert = alert; // Add the alert to the response
                responseMessage.message = "Train details added and chain pull alert triggered!";
                await logActivity(`Chain pull alert triggered and email sent for Train: ${train_Number}, Coach: ${coach}.`, 'success');
                
                // Mark this alert as new for the polling endpoint
                const alertKey = `${train_Number}-${coach}-${savedTrain._id}`;
                // Don't add to sentAlerts here, let getActiveChainPulls handle it
            } else {
                // If a previous pull exists, still send the alert to the frontend, but don't re-send the email or log a new entry
                responseMessage.alert = alert;
            }
        } else {
            // Log for non-pulled status
            await logActivity(`Added train details for Train: ${train_Number}, Coach: ${coach}, Status: ${chain_status}.`, 'success');
        }
        
        res.status(201).json(responseMessage);
        
    } catch (error) {
        await logActivity(`Add Train Details: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};

// Fetch train details by train_Number and coach
module.exports.getTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach } = req.query;

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

// Modified function to return only NEW chain pull alerts (one-time process)
module.exports.getActiveChainPulls = async (req, res) => {
    try {
        // Get the most recent entry for each train-coach combination with pulled status
        const activeAlerts = await Train.aggregate([
            {
                $match: { chain_status: "pulled" }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: { train_Number: "$train_Number", coach: "$coach" },
                    latestRecord: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestRecord" }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Filter out alerts that have already been sent to frontend
        const newAlerts = activeAlerts.filter(alert => {
            const alertKey = `${alert.train_Number}-${alert.coach}-${alert._id}`;
            if (!sentAlerts.has(alertKey)) {
                sentAlerts.add(alertKey); // Mark as sent
                return true;
            }
            return false;
        });

        // Only log if there are new alerts
        if (newAlerts.length > 0) {
            await logActivity(`Found ${newAlerts.length} new chain pull alerts to send to frontend.`, 'info');
        }
        
        res.status(200).json({
            message: "Active chain pulls fetched successfully!",
            alerts: newAlerts // Return only new alerts
        });
    } catch (error) {
        await logActivity(`Get Active Chain Pulls: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error fetching active chain pulls:", error);
        res.status(500).json({
            message: "An error occurred while fetching active chain pulls",
            error: error.message
        });
    }
};

// Optional: Add a function to clear sent alerts (useful for testing or manual reset)
module.exports.clearSentAlerts = async (req, res) => {
    try {
        sentAlerts.clear();
        await logActivity('Cleared all sent alerts cache.', 'info');
        res.status(200).json({ message: "Sent alerts cache cleared successfully!" });
    } catch (error) {
        await logActivity(`Clear Sent Alerts: An error occurred. Error: ${error.message}`, 'error');
        res.status(500).json({ message: "An error occurred while clearing sent alerts", error: error.message });
    }
};

// Get chain status statistics for dashboard
module.exports.getChainStatusStats = async (req, res) => {
    try {
        const stats = await Train.aggregate([
            {
                $group: {
                    _id: "$chain_status",
                    count: { $sum: 1 },
                    latestUpdate: { $max: "$createdAt" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        await logActivity(`Fetched chain status statistics.`, 'info');
        
        res.status(200).json({
            message: "Chain status statistics fetched successfully!",
            stats: stats
        });
    } catch (error) {
        await logActivity(`Get Chain Status Stats: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error fetching chain status statistics:", error);
        res.status(500).json({
            message: "An error occurred while fetching chain status statistics",
            error: error.message
        });
    }
};