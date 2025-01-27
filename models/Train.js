const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema({
    train_Number: {
        type: String,
        ref: "Division", // Reference to the Division schema
        required: true,
    },
    coach: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        
    },
    time: {
        type: String,
        
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
    chain_status: {
        type: String,
        default: "normal",
        enum: ["normal", "pulled"],
    },
    temperature: {
        type: String,
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Division",
    },
    error: { 
        type: String,
        
        default: "000",
    },
    memory: {
        type: String,
        
        default: "Not available",
    },
    humidity: {
        type: String,
        
        default: "Not available",
    },
});

module.exports = mongoose.model("Train", trainSchema);
