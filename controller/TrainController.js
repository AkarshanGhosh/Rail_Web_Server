const Train = require("../models/Train"); // Import Train model
const Division = require("../models/Division"); // Import Division model
const User = require("../models/User"); // Import User model
const transporter = require('../config/nodemailer'); // Import pre-configured nodemailer transporter

// Function to send an email to all users when chain status is pulled
const sendChainStatusEmail = async (train) => {
    try {
        // Fetch only email addresses from the User collection
        const emails = await User.find({}, { email: 1, _id: 0 }).then(users => users.map(user => user.email));

        if (emails.length === 0) {
            //console.log("No users found to send the email.");
            return;
        }

        //console.log("Emails to send:", emails);

        // Send email to each user individually
        for (const email of emails) {
            const mailOptions = {
                from: process.env.SENDER_EMAIL, // Sender's email address (configured in .env)
                to: email, // Send to one user at a time
                subject: "Chain Pulled Notification", // Subject of the email
                text: `Alert! The chain status of train "${train.train_Number}" (Coach: ${train.coach}) has been updated to "Pulled". Please take necessary actions immediately.`, // Email body
            };
            //console.log(mailOptions)

            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${email} successfully! Response: ${info.response}`);
        }
    } catch (error) {
        //console.error("Error while sending chain status email:", error);
    }
};
// Add data 
module.exports.addTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach, chain_status, latitude, longitude, temperature, error, memory, humidity } = req.body;

        // Check if the train number exists in the Division model
        const divisionExists = await Division.findOne({ train_Number });

        if (!divisionExists) {
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
        });

        // Save the train
        const savedTrain = await newTrain.save();

        // If the chain status is "Pulled", send an email to all users
        if (savedTrain.chain_status === "pulled") {
            await sendChainStatusEmail(savedTrain);
        }

        res.status(201).json({ message: "Train details added successfully!", train: savedTrain });
    } catch (error) {
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};



// Add train details
module.exports.addTrainDetails = async (req, res) => {
    try {
        const { train_Number, coach, chain_status, latitude, longitude, temperature, error, memory, humidity } = req.body;

        // Check if the train number exists in the Division model
        const divisionExists = await Division.findOne({ train_Number });

        if (!divisionExists) {
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
        });

        // Save the train details
        const savedTrain = await newTrain.save();

        // If the chain status is "Pulled", send an email to all users
        if (savedTrain.chain_status === "pulled") {
            await sendChainStatusEmail(savedTrain);
        }

        res.status(201).json({ message: "Train details added successfully!", train: savedTrain });
    } catch (error) {
        console.error("Error adding train details:", error);
        res.status(500).json({ message: "An error occurred while adding the train details", error: error.message });
    }
};


// Fetch train details by train_number and coach
module.exports.getTrainDetails = async (req, res) => {
    try {
        // Extract train_Number and coach from the URL query parameters
        const { train_Number, coach } = req.query; 
        console.log("Train Number:", train_Number, "Coach:", coach);

        // Validate input
        if (!train_Number || !coach) {
            return res.status(400).json({ message: "Train number and coach are required." });
        }

        // Find the train details based on train_Number and coach
        const train = await Train.find({ train_Number, coach });

        // Check if train details are found
        if (train.length === 0) {
            return res.status(404).json({ message: "Train details not found for the given train number and coach." });
        }

        // Return the found train details
        res.status(200).json({ 
            message: "Train details fetched successfully!", 
            train 
        });
    } catch (error) {
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

        // Validate input
        if (!train_Name && !train_Number) {
            return res.status(400).json({ message: "Either train name or train number is required." });
        }

        // Build the query to fetch coaches based on train_Name or train_Number
        const query = {};
        if (train_Name) {
            query.train_Name = train_Name;
        }
        if (train_Number) {
            query.train_Number = train_Number;
        }

        // Find the trains based on the query
        const trains = await Train.find(query);

        if (trains.length === 0) {
            return res.status(404).json({ message: "No coaches found for the given train name or number." });
        }

        // Extract the unique coaches
        const coaches = [...new Set(trains.map(train => train.coach))];

        // Return the available coaches
        res.status(200).json({ message: "Available coaches fetched successfully!", coaches });
    } catch (error) {
        console.error("Error fetching available coaches:", error);
        res.status(500).json({ message: "An error occurred while fetching available coaches", error: error.message });
    }
};