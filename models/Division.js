const mongoose = require("mongoose");

const divisionSchema = new mongoose.Schema(
    {
        division: {
            type: String,
            required: true,
        },
        states: {
            type: String,
            required: true,
        },
        cities: {
            type: String,
            required: true,
        },
        train_Name: { // ✅ FIXED: Ensure this matches exactly with request body
            type: String,
            required: true,
        },
        train_Number: { // ✅ FIXED: Use lowercase "train_Number" for consistency
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Division", divisionSchema);
