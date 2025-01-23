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
        train_Name: {
            type: String,
            required: true,
        },
        train_Number: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Division", divisionSchema);
