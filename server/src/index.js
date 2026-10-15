
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const trainRoutes = require("./routes/trainRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");
const { initializeSocket } = require("./sockets/socket");

const app = express();
const httpServer = http.createServer(app);

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("RailBite Backend Running");
});

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "RailBite server is healthy"
    });
});

app.use("/auth", authRoutes);
app.use("/trains", trainRoutes);
app.use("/food", foodRoutes);
app.use("/orders", orderRoutes);

// Error middleware must come after routes.
app.use(errorMiddleware);

// Initialize Socket.IO.
initializeSocket(httpServer);

const PORT = process.env.PORT || 8085;

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from the environment");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from the environment");
    process.exit(1);
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        httpServer.listen(PORT, () => {
            console.log(`RailBite server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
