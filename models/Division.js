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
        train_name: { // ✅ FIXED: Ensure this matches exactly with request body
            type: String,
            required: true,
        },
        train_number: { // ✅ FIXED: Use lowercase "train_number" for consistency
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Division", divisionSchema);
