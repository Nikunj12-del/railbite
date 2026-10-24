
const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../models/Order");
const Train = require("../models/Train");
const FoodItem = require("../models/FoodItem");
const razorpay = require("../config/razorpay");
const { getIO } = require("../sockets/socket");

// CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const {
            trainId,
            coachNumber,
            seatNumber,
            items,
            specialInstructions
        } = req.body;

        if (
            !trainId ||
            typeof coachNumber !== "string" ||
            !coachNumber.trim() ||
            seatNumber === undefined ||
            seatNumber === null ||
            String(seatNumber).trim() === "" ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Train, coach, seat and food items are required"
            });
        }

        if (!mongoose.isValidObjectId(trainId)) {
            return res.status(400).json({
                message: "Invalid train ID"
            });
        }

        const train = await Train.findById(trainId);

        if (!train) {
            return res.status(404).json({
                message: "Train not found"
            });
        }

        const quantities = new Map();

        for (const item of items) {
            if (
                !item.foodItem ||
                !mongoose.isValidObjectId(item.foodItem) ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) < 1
            ) {
                return res.status(400).json({
                    message: "Invalid food item or quantity"
                });
            }

            const foodId = String(item.foodItem);

            quantities.set(
                foodId,
                (quantities.get(foodId) || 0) + Number(item.quantity)
            );
        }

        const foodIds = [...quantities.keys()];

        // FoodItem schema uses isAvailable, not available.
        const foodItems = await FoodItem.find({
            _id: { $in: foodIds },
            isAvailable: true
        });

        if (foodItems.length !== foodIds.length) {
            return res.status(400).json({
                message: "One or more food items are unavailable"
            });
        }

        const orderItems = foodItems.map((food) => ({
            foodItem: food._id,
            quantity: quantities.get(String(food._id)),
            price: food.price
        }));

        const totalAmount = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({
                message: "Invalid order total"
            });
        }

        const order = await Order.create({
            user: req.user.userId,
            train: train._id,
            coachNumber: coachNumber.trim(),
            seatNumber: String(seatNumber).trim(),
            items: orderItems,
            totalAmount,
            specialInstructions: specialInstructions || "",
            status: "PLACED",
            paymentStatus: "PENDING",
            paymentMethod: "RAZORPAY"
        });

        const populatedOrder = await Order.findById(order._id)
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image");

        return res.status(201).json({
            message: "Order created. Complete payment to confirm it.",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            message: "Failed to create order"
        });
    }
};

// CREATE RAZORPAY PAYMENT ORDER
const createPayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.paymentStatus === "PAID") {
            return res.status(400).json({
                message: "Order has already been paid"
            });
        }

        if (
            order.status === "CANCELLED" ||
            order.paymentStatus === "REFUNDED"
        ) {
            return res.status(400).json({
                message: "This order cannot be paid"
            });
        }

        if (order.razorpayOrderId) {
            return res.json({
                message: "Payment order already created",
                orderId: order.razorpayOrderId,
                amount: Math.round(order.totalAmount * 100),
                currency: "INR",
                key: process.env.RAZORPAY_KEY_ID
            });
        }

        const paymentOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: String(order._id)
        });

        order.razorpayOrderId = paymentOrder.id;
        await order.save();

        return res.status(201).json({
            message: "Payment order created",
            orderId: paymentOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Create payment error:", error);

        return res.status(500).json({
            message: "Failed to create payment"
        });
    }
};

// VERIFY RAZORPAY PAYMENT
const verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Payment verification details are required"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.paymentStatus === "PAID") {
            return res.json({
                message: "Payment already verified",
                order
            });
        }

        if (order.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled orders cannot be paid"
            });
        }

        if (
            !order.razorpayOrderId ||
            order.razorpayOrderId !== razorpay_order_id
        ) {
            return res.status(400).json({
                message: "Razorpay order does not match"
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const signatureBuffer = Buffer.from(razorpay_signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");

        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            return res.status(400).json({
                message: "Invalid payment signature"
            });
        }

        let payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (
            payment.order_id !== razorpay_order_id ||
            payment.amount !== Math.round(order.totalAmount * 100) ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                message: "Payment details do not match"
            });
        }

        if (payment.status === "authorized") {
            payment = await razorpay.payments.capture(
                razorpay_payment_id,
                Math.round(order.totalAmount * 100),
                "INR"
            );
        }

        if (payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment has not been captured"
            });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                user: req.user.userId,
                paymentStatus: "PENDING",
                status: { $ne: "CANCELLED" },
                razorpayOrderId: razorpay_order_id
            },
            {
                $set: {
                    paymentStatus: "PAID",
                    razorpayPaymentId: razorpay_payment_id
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            const latestOrder = await Order.findById(order._id);

            if (latestOrder?.paymentStatus === "PAID") {
                return res.json({
                    message: "Payment already verified",
                    order: latestOrder
                });
            }

            return res.status(400).json({
                message: "Order could not be confirmed. Contact support if money was deducted."
            });
        }

        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image");

        const io = getIO();

        io.to("pantry").emit("new-order", {
            order: populatedOrder
        });

        io.to(`user:${req.user.userId}`).emit("order-updated", {
            order: populatedOrder
        });

        return res.json({
            message: "Payment verified successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Verify payment error:", error);

        return res.status(500).json({
            message: "Failed to verify payment"
        });
    }
};

// GET LOGGED-IN PASSENGER'S ORDERS
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId
        })
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image")
            .sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
};

// GET A SINGLE PASSENGER ORDER
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.userId
        })
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.json({ order });
    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            message: "Failed to fetch order"
        });
    }
};

// CANCEL UNPAID PASSENGER ORDER
const cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.paymentStatus === "PAID") {
            return res.status(400).json({
                message: "Paid orders cannot be cancelled through this endpoint"
            });
        }

        if (order.status !== "PLACED") {
            return res.status(400).json({
                message: "This order can no longer be cancelled"
            });
        }

        order.status = "CANCELLED";
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image");

        getIO().to(`user:${req.user.userId}`).emit("order-updated", {
            order: populatedOrder
        });

        return res.json({
            message: "Order cancelled successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            message: "Failed to cancel order"
        });
    }
};

// GET PAID ORDERS FOR PANTRY STAFF
const getPantryOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            paymentStatus: "PAID",
            status: {
                $in: [
                    "PLACED",
                    "ACCEPTED",
                    "PREPARING",
                    "READY",
                    "OUT_FOR_DELIVERY"
                ]
            }
        })
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image")
            .sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        console.error("Get pantry orders error:", error);

        return res.status(500).json({
            message: "Failed to fetch pantry orders"
        });
    }
};

// UPDATE ORDER STATUS BY PANTRY STAFF
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "ACCEPTED",
            "PREPARING",
            "READY",
            "OUT_FOR_DELIVERY",
            "DELIVERED"
        ];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await Order.findOne({
            _id: id,
            paymentStatus: "PAID"
        });

        if (!order) {
            return res.status(404).json({
                message: "Paid order not found"
            });
        }

        const validTransitions = {
            PLACED: ["ACCEPTED"],
            ACCEPTED: ["PREPARING"],
            PREPARING: ["READY"],
            READY: ["OUT_FOR_DELIVERY"],
            OUT_FOR_DELIVERY: ["DELIVERED"]
        };

        if (!(validTransitions[order.status] || []).includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from ${order.status} to ${status}`
            });
        }

        order.status = status;
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate("items.foodItem", "name price category image");

        const io = getIO();

        io.to(`user:${order.user}`).emit("order-updated", {
            order: populatedOrder
        });

        io.to("pantry").emit("order-status-updated", {
            order: populatedOrder
        });

        return res.json({
            message: "Order status updated successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            message: "Failed to update order status"
        });
    }
};

module.exports = {
    createOrder,
    createPayment,
    verifyPayment,
    getMyOrders,
    getOrderById,
    cancelMyOrder,
    getPantryOrders,
    updateOrderStatus
};
