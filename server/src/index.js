
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

const PORT = process.env.PORT || 8085;

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
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

app.use(errorMiddleware);

initializeSocket(httpServer);

async function startServer() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing from the environment");
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing from the environment");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        httpServer.listen(PORT, "0.0.0.0", () => {
            console.log(`RailBite server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
