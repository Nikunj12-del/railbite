
const express = require("express");

const {
    createOrder,
    createPayment,
    verifyPayment,
    getMyOrders,
    getOrderById,
    cancelMyOrder,
    getPantryOrders,
    updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Pantry staff routes — allow pantry_staff and passenger (for live testing)
router.get(
    "/pantry",
    authMiddleware,
    roleMiddleware(["pantry_staff", "passenger"]),
    getPantryOrders
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware(["pantry_staff", "passenger"]),
    updateOrderStatus
);

// Passenger routes
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

router.patch(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("passenger"),
    cancelMyOrder
);

// Razorpay payment routes
router.post(
    "/:id/create-payment",
    authMiddleware,
    roleMiddleware("passenger"),
    createPayment
);

router.post(
    "/:id/verify-payment",
    authMiddleware,
    roleMiddleware("passenger"),
    verifyPayment
);

// Generic ID route — LAST
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("passenger"),
    getOrderById
);

module.exports = router;
