const FoodItem = require("../models/FoodItem");

const getFoodItems = async (req, res) => {
    try {
        const foodItems = await FoodItem.find({
            isAvailable: true
        }).sort({ category: 1, name: 1 });

        res.json(foodItems);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch food items"
        });
    }
};

const getFoodItemById = async (req, res) => {
    try {
        const foodItem = await FoodItem.findById(req.params.id);

        if (!foodItem) {
            return res.status(404).json({
                message: "Food item not found"
            });
        }

        res.json(foodItem);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch food item"
        });
    }
};

module.exports = {
    getFoodItems,
    getFoodItemById
};