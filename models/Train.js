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
        type: Date,
        default: Date.now,
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
        required: true,
        default: "000",
    },
    memory: {
        type: String,
        required: true,
        default: "Not available",
    },
    humidity: {
        type: String,
        required: true,
        default: "Not available",
    },
});

module.exports = mongoose.model("Train", trainSchema);
