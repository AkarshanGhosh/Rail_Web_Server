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
        train_name: {
            type: String,
            required: true,
        },
        train_number: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Division", divisionSchema);
