const express = require("express");

const {
    getTrains,
    getTrainById
} = require("../controllers/trainController");

const router = express.Router();

router.get("/", getTrains);
router.get("/:id", getTrainById);

module.exports = router;