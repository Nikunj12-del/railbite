const express = require("express");

const {
    getFoodItems,
    getFoodItemById
} = require("../controllers/foodController");

const router = express.Router();

router.get("/", getFoodItems);
router.get("/:id", getFoodItemById);

module.exports = router;