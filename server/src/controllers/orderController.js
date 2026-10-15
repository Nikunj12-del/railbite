const mongoose = require("mongoose");
const Order = require("../models/Order");
const Train = require("../models/Train");
const FoodItem = require("../models/FoodItem");
const { getIO } = require("../sockets/socket");

const createOrder = async (req, res) => {
    try {
        const {
            trainId,
            coachNumber,
            seatNumber,
            items,
            specialInstructions
        } = req.body;

        if (!trainId || !mongoose.isValidObjectId(trainId)) {
            return res.status(400).json({
                message: "Valid train ID is required"
            });
        }

        if (!coachNumber || !String(coachNumber).trim()) {
            return res.status(400).json({
                message: "Coach number is required"
            });
        }

        if (
            !Number.isInteger(Number(seatNumber)) ||
            Number(seatNumber) < 1
        ) {
            return res.status(400).json({
                message: "Valid seat number is required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one food item is required"
            });
        }

        const itemIds = [];
        const quantities = {};

        for (const item of items) {
            if (
                !item.foodItem ||
                !mongoose.isValidObjectId(item.foodItem)
            ) {
                return res.status(400).json({
                    message: "Invalid food item ID"
                });
            }

            if (
                !Number.isInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 20
            ) {
                return res.status(400).json({
                    message: "Quantity must be between 1 and 20"
                });
            }

            const id = String(item.foodItem);

            if (quantities[id]) {
                return res.status(400).json({
                    message: "Duplicate food items are not allowed"
                });
            }

            quantities[id] = item.quantity;
            itemIds.push(id);
        }

        const train = await Train.findById(trainId);

        if (!train) {
            return res.status(404).json({
                message: "Train not found"
            });
        }

        const coach = train.coaches.find(
            (item) =>
                item.coachNumber === String(coachNumber).trim()
        );

        if (!coach) {
            return res.status(400).json({
                message: "Coach does not belong to this train"
            });
        }

        if (Number(seatNumber) > coach.seats) {
            return res.status(400).json({
                message: "Seat number exceeds the coach seat count"
            });
        }

        const foodItems = await FoodItem.find({
            _id: { $in: itemIds },
            isAvailable: true
        });

        if (foodItems.length !== itemIds.length) {
            return res.status(400).json({
                message: "One or more food items are unavailable"
            });
        }

        const orderItems = foodItems.map((food) => ({
            foodItem: food._id,
            quantity: quantities[String(food._id)],
            price: food.price
        }));

        const totalAmount = orderItems.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        const order = await Order.create({
            user: req.user.userId,
            train: train._id,
            coachNumber: String(coachNumber).trim(),
            seatNumber: Number(seatNumber),
            items: orderItems,
            totalAmount,
            specialInstructions:
                typeof specialInstructions === "string"
                    ? specialInstructions.trim().slice(0, 500)
                    : "",
            status: "PLACED"
        });

        const populatedOrder = await Order.findById(order._id)
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            );

        getIO().to("pantry").emit("new-order", {
            order: populatedOrder
        });

        return res.status(201).json({
            message: "Order placed successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Create order error:", error.message);

        return res.status(500).json({
            message: "Failed to place order"
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId
        })
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            )
            .sort({ createdAt: -1 });

        return res.json({
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Get my orders error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch your orders"
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId
        })
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.json({ order });
    } catch (error) {
        console.error("Get order error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch order"
        });
    }
};

const cancelMyOrder = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.status !== "PLACED") {
            return res.status(400).json({
                message:
                    "Only orders with PLACED status can be cancelled"
            });
        }

        order.status = "CANCELLED";
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            );

        getIO()
            .to(`user:${req.user.userId}`)
            .emit("order-updated", {
                order: populatedOrder
            });

        return res.json({
            message: "Order cancelled successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Cancel order error:", error.message);

        return res.status(500).json({
            message: "Failed to cancel order"
        });
    }
};

const getPantryOrders = async (req, res) => {
    try {
        const activeStatuses = [
            "PLACED",
            "ACCEPTED",
            "PREPARING",
            "READY",
            "OUT_FOR_DELIVERY"
        ];

        const orders = await Order.find({
            status: { $in: activeStatuses }
        })
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            )
            .sort({ createdAt: 1 });

        const groupedOrders = {};

        for (const order of orders) {
            const coach = order.coachNumber;

            if (!groupedOrders[coach]) {
                groupedOrders[coach] = [];
            }

            groupedOrders[coach].push(order);
        }

        return res.json({
            count: orders.length,
            orders,
            groupedOrders
        });
    } catch (error) {
        console.error("Get pantry orders error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch pantry orders"
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const previousStatuses = {
            ACCEPTED: ["PLACED"],
            PREPARING: ["ACCEPTED"],
            READY: ["PREPARING"],
            OUT_FOR_DELIVERY: ["READY"],
            DELIVERED: ["OUT_FOR_DELIVERY"],
            CANCELLED: ["PLACED", "ACCEPTED", "PREPARING"]
        };

        if (!status || !previousStatuses[status]) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                status: {
                    $in: previousStatuses[status]
                }
            },
            {
                $set: { status }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("user", "fullName email")
            .populate("train", "trainNumber trainName")
            .populate(
                "items.foodItem",
                "name price category image"
            );

        if (!updatedOrder) {
            const existingOrder = await Order.findById(
                req.params.id
            );

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            return res.status(400).json({
                message:
                    `Cannot change order from ${existingOrder.status} to ${status}`
            });
        }

        const io = getIO();

        io.to(`user:${updatedOrder.user._id}`).emit(
            "order-updated",
            {
                order: updatedOrder
            }
        );

        io.to("pantry").emit("order-updated", {
            order: updatedOrder
        });

        return res.json({
            message: "Order status updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Update order status error:", error.message);

        return res.status(500).json({
            message: "Failed to update order status"
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelMyOrder,
    getPantryOrders,
    updateOrderStatus
};
