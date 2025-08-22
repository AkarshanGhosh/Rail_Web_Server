const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema({
    train_Number: {
        type: String,
        ref: "Division", // Reference to the Division schema
        required: true,
    },
    coach_uid: {
        type: String,
        required: [true, 'Coach UID is required'],
        validate: {
            validator: function(uid) {
                return /^\d+$/.test(uid);
            },
            message: 'Coach UID must be a numeric string'
        }
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better query performance
trainSchema.index({ train_Number: 1 });
trainSchema.index({ coach_uid: 1 });
trainSchema.index({ train_Number: 1, coach_uid: 1 }); // Compound index for queries filtering by both

// Pre-save middleware to validate that the coach_uid exists in the referenced Division
trainSchema.pre('save', async function(next) {
    if (this.train_Number && this.coach_uid) {
        try {
            const Division = mongoose.model('Division');
            
            // First check if the train number exists in Division
            const trainExists = await Division.findOne({
                train_Number: this.train_Number
            });
            
            if (!trainExists) {
                const error = new Error(`Train number ${this.train_Number} not found in Division schema. Please check again.`);
                error.name = 'ValidationError';
                return next(error);
            }
            
            // Then check if the coach_uid exists under this train number
            const division = await Division.findOne({
                train_Number: this.train_Number,
                'coach_uid.uid': this.coach_uid
            });
            
            if (!division) {
                const error = new Error(`No UID ${this.coach_uid} found under train number ${this.train_Number}. Please check again.`);
                error.name = 'ValidationError';
                return next(error);
            }
            
            // Set the division ObjectId if not already set
            if (!this.division) {
                this.division = division._id;
            }
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Virtual to get coach name from Division
trainSchema.virtual('coach_name').get(function() {
    if (this.populated('division') && this.division && this.division.coach_uid) {
        const coach = this.division.coach_uid.find(c => c.uid === this.coach_uid);
        return coach ? coach.coach_name : null;
    }
    return null;
});

// Method to populate coach details
trainSchema.methods.populateCoachDetails = function() {
    return this.populate({
        path: 'division',
        select: 'coach_uid division states cities train_Name train_Number'
    });
};

module.exports = mongoose.model("Train", trainSchema);