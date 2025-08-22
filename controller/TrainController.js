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

        // Get coach name from division data
        const division = await Division.findOne({ train_Number: train.train_Number });
        const coach = division?.coach_uid.find(c => c.uid === train.coach_uid);
        const coachName = coach ? coach.coach_name : train.coach_uid;

        for (const email of emails) {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "Chain Pulled Notification",
                text: `Alert! The chain status of train "${train.train_Number}" (Coach: ${coachName}) has been updated to "Pulled". Please take necessary actions immediately.`,
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
        const { train_Number, coach_uid, chain_status, latitude, longitude, temperature, error, memory, humidity, date, time } = req.body;

        // Validate required fields
        if (!train_Number || !coach_uid) {
            await logActivity(`Add Train Details: Missing required fields - train_Number: ${train_Number}, coach_uid: ${coach_uid}`, 'warning');
            return res.status(400).json({ message: "Train number and coach UID are required." });
        }

        // Create a new train entry (validation will be handled by the model's pre-save middleware)
        const newTrain = new Train({
            train_Number,
            coach_uid,
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

        try {
            const savedTrain = await newTrain.save();
            
            // Populate division data to get coach name and other details
            await savedTrain.populateCoachDetails();
            
            // Get coach name for alert
            const coachName = savedTrain.coach_name || coach_uid;
            
            // This is the new, direct alert data, now with `createdAt`
            const alert = {
                _id: savedTrain._id, // Add _id for key prop on frontend
                train_Name: savedTrain.division?.train_Name || 'Unknown',
                train_Number: savedTrain.train_Number,
                coach_uid: savedTrain.coach_uid,
                coach_name: coachName,
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
            
            // Check if the chain was pulled AND if this is the first time for this train/coach_uid
            if (savedTrain.chain_status === "pulled") {
                // Find any previous "pulled" records for this specific train and coach_uid
                const previousPull = await Train.findOne({ 
                    train_Number, 
                    coach_uid,
                    chain_status: "pulled",
                    _id: { $ne: savedTrain._id } // Exclude the current record
                });

                // If this is the first pull, send the email alert and log it once
                if (!previousPull) {
                    await sendChainStatusEmail(savedTrain);
                    responseMessage.alert = alert; // Add the alert to the response
                    responseMessage.message = "Train details added and chain pull alert triggered!";
                    await logActivity(`Chain pull alert triggered and email sent for Train: ${train_Number}, Coach UID: ${coach_uid}.`, 'success');
                    
                    // Mark this alert as new for the polling endpoint
                    const alertKey = `${train_Number}-${coach_uid}-${savedTrain._id}`;
                    // Don't add to sentAlerts here, let getActiveChainPulls handle it
                } else {
                    // If a previous pull exists, still send the alert to the frontend, but don't re-send the email or log a new entry
                    responseMessage.alert = alert;
                }
            } else {
                // Log for non-pulled status
                await logActivity(`Added train details for Train: ${train_Number}, Coach UID: ${coach_uid}, Status: ${chain_status}.`, 'success');
            }
            
            res.status(201).json(responseMessage);
            
        } catch (saveError) {
            // Handle validation errors from the model
            if (saveError.name === 'ValidationError') {
                await logActivity(`Add Train Details: Validation error - ${saveError.message}`, 'warning');
                return res.status(400).json({ message: saveError.message });
            }
            throw saveError; // Re-throw if it's not a validation error
        }
        
    } catch (error) {
        await logActivity(`Add Train Details: An error occurred. Error: ${error.message}`, 'error');
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};

// Fetch train details by train_Number and coach_uid
module.exports.getTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach_uid } = req.query;

        if (!train_Number || !coach_uid) {
            await logActivity(`Get Train Details: Missing train number or coach UID in query.`, 'warning');
            return res.status(400).json({ message: "Train number and coach UID are required." });
        }

        const trains = await Train.find({ train_Number, coach_uid });

        if (trains.length === 0) {
            await logActivity(`Get Train Details: No details found for Train: ${train_Number}, Coach UID: ${coach_uid}.`, 'info');
            return res.status(404).json({ message: "Train details not found for the given train number and coach UID." });
        }

        // Populate coach details for each train
        const populatedTrains = await Promise.all(
            trains.map(train => train.populateCoachDetails())
        );

        await logActivity(`Fetched train details for Train: ${train_Number}, Coach UID: ${coach_uid}.`, 'info');
        res.status(200).json({
            message: "Train details fetched successfully!",
            train: populatedTrains
        });
    } catch (error) {
        await logActivity(`Get Train Details: An error occurred for Train: ${req.query.train_Number}, Coach UID: ${req.query.coach_uid}. Error: ${error.message}`, 'error');
        console.error("Error fetching train details:", error);
        res.status(500).json({
            message: "An error occurred while fetching train details",
            error: error.message
        });
    }
};

// Fetch available coach UIDs under the train name or train number
module.exports.getAvailableCoaches = async (req, res) => {
    try {
        const { train_Name, train_Number } = req.body;

        if (!train_Name && !train_Number) {
            await logActivity(`Get Available Coaches: Missing train name or number in request.`, 'warning');
            return res.status(400).json({ message: "Either train name or train number is required." });
        }

        // First, get the division data to find available coach UIDs
        const query = {};
        if (train_Name) {
            query.train_Name = train_Name;
        }
        if (train_Number) {
            query.train_Number = train_Number;
        }

        const division = await Division.findOne(query);

        if (!division) {
            await logActivity(`Get Available Coaches: No division found for Train Name: ${train_Name || 'N/A'}, Train Number: ${train_Number || 'N/A'}.`, 'info');
            return res.status(404).json({ message: "No train found in division for the given train name or number." });
        }

        // Get all coach UIDs from the division
        const availableCoaches = division.coach_uid.map(coach => ({
            uid: coach.uid,
            coach_name: coach.coach_name
        }));

        // Optionally, you can also check which coaches have active train entries
        const activeCoachUIDs = await Train.distinct('coach_uid', { train_Number: division.train_Number });

        const coachesWithStatus = availableCoaches.map(coach => ({
            ...coach,
            hasActiveEntries: activeCoachUIDs.includes(coach.uid)
        }));

        await logActivity(`Fetched available coaches for Train Name: ${train_Name || 'N/A'}, Train Number: ${train_Number || 'N/A'}. Found ${availableCoaches.length} coaches.`, 'info');
        res.status(200).json({ 
            message: "Available coaches fetched successfully!", 
            coaches: coachesWithStatus,
            train_info: {
                train_Name: division.train_Name,
                train_Number: division.train_Number,
                division: division.division,
                states: division.states,
                cities: division.cities
            }
        });
    } catch (error) {
        await logActivity(`Get Available Coaches: An error occurred for Train Name: ${req.body.train_Name || 'N/A'}, Train Number: ${req.body.train_Number || 'N/A'}. Error: ${error.message}`, 'error');
        console.error("Error fetching available coaches:", error);
        res.status(500).json({ message: "An error occurred while fetching available coaches", error: error.message });
    }
};

// Modified function to return only NEW chain pull alerts (one-time process)
module.exports.getActiveChainPulls = async (req, res) => {
    try {
        // Get the most recent entry for each train-coach_uid combination with pulled status
        const activeAlerts = await Train.aggregate([
            {
                $match: { chain_status: "pulled" }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: { train_Number: "$train_Number", coach_uid: "$coach_uid" },
                    latestRecord: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestRecord" }
            },
            {
                $lookup: {
                    from: "divisions",
                    localField: "train_Number",
                    foreignField: "train_Number",
                    as: "divisionData"
                }
            },
            {
                $addFields: {
                    train_Name: { $arrayElemAt: ["$divisionData.train_Name", 0] },
                    coach_name: {
                        $let: {
                            vars: {
                                coach: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: { $arrayElemAt: ["$divisionData.coach_uid", 0] },
                                                cond: { $eq: ["$$this.uid", "$coach_uid"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: "$$coach.coach_name"
                        }
                    }
                }
            },
            {
                $project: {
                    divisionData: 0 // Remove the divisionData field from output
                }
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
            const alertKey = `${alert.train_Number}-${alert.coach_uid}-${alert._id}`;
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