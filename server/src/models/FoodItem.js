const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Breakfast",
                "Meals",
                "Snacks",
                "Beverages",
                "Desserts"
            ]
        },

        image: {
            type: String,
            default: ""
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        preparationTime: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FoodItem", foodItemSchema); 