
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
const seedDatabase = require("./seed/seedDatabase");

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 8085;

const DEFAULT_FRONTEND_URL = "https://railbite-puce.vercel.app";
const configuredFrontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.trim().replace(/\/+$/, "")
    : null;

const allowedOrigins = Array.from(
    new Set([
        "http://localhost:5173",
        DEFAULT_FRONTEND_URL,
        ...(configuredFrontendUrl ? [configuredFrontendUrl] : [])
    ])
);

function isOriginAllowed(origin) {
    if (!origin) return true;
    const normalized = origin.trim().replace(/\/+$/, "");
    if (allowedOrigins.includes(normalized) || allowedOrigins.includes(origin)) {
        return true;
    }
    // Allow RailBite preview, branch, and production deployments on Vercel
    if (/^https:\/\/railbite[a-z0-9-]*\.vercel\.app$/i.test(normalized)) {
        return true;
    }
    return false;
}

app.use(
    cors({
        origin: function (origin, callback) {
            if (isOriginAllowed(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS error: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
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

app.get("/seed", async (req, res) => {
    try {
        await seedDatabase(false);
        res.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/seed", async (req, res) => {
    try {
        await seedDatabase(false);
        res.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
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

        // Seed initial data (trains, food items, pantry account) if not already present
        try {
            await seedDatabase(false);
        } catch (seedError) {
            console.error("Auto-seed on startup failed:", seedError.message);
        }

        httpServer.listen(PORT, "0.0.0.0", () => {
            console.log(`RailBite server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
