const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        train: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Train",
            required: true
        },

        coachNumber: {
            type: String,
            required: true
        },

        seatNumber: {
            type: String,
            required: true
        },

        items: [
            {
                foodItem: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "FoodItem",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // Razorpay payment details
        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED"
            ],
            default: "PENDING"
        },

        paymentMethod: {
            type: String,
            default: "RAZORPAY"
        },

        razorpayOrderId: {
            type: String,
            default: null
        },

        razorpayPaymentId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "PLACED",
                "ACCEPTED",
                "PREPARING",
                "READY",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PLACED"
        },

        specialInstructions: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);
