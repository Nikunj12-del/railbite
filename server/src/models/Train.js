const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema(
    {
        trainNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        trainName: {
            type: String,
            required: true,
            trim: true
        },

        coaches: [
            {
                coachNumber: {
                    type: String,
                    required: true
                },

                seats: {
                    type: Number,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Train", trainSchema);