const Train = require("../models/Train");

const getTrains = async (req, res) => {
    try {
        const trains = await Train.find().sort({ trainNumber: 1 });

        res.json(trains);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch trains"
        });
    }
};

const getTrainById = async (req, res) => {
    try {
        const train = await Train.findById(req.params.id);

        if (!train) {
            return res.status(404).json({
                message: "Train not found"
            });
        }

        res.json(train);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch train"
        });
    }
};

module.exports = {
    getTrains,
    getTrainById
};