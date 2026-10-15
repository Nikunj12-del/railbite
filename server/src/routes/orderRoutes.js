
const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelMyOrder,
    getPantryOrders,
    updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("passenger"),
    createOrder
);

router.get(
    "/my-orders",
    authMiddleware,
    roleMiddleware("passenger"),
    getMyOrders
);

router.get(
    "/pantry",
    authMiddleware,
    roleMiddleware("pantry_staff"),
    getPantryOrders
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("passenger"),
    cancelMyOrder
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("passenger"),
    getOrderById
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("pantry_staff"),
    updateOrderStatus
);

module.exports = router;
