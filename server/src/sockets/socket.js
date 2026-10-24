
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function parseCookies(cookieHeader = "") {
    const cookies = {};
    if (!cookieHeader || typeof cookieHeader !== "string") {
        return cookies;
    }

    cookieHeader.split(";").forEach((cookieString) => {
        const separatorIndex = cookieString.indexOf("=");

        if (separatorIndex === -1) {
            return;
        }

        const name = cookieString.slice(0, separatorIndex).trim();
        const value = cookieString.slice(separatorIndex + 1).trim();

        if (name) {
            try {
                cookies[name] = decodeURIComponent(value);
            } catch {
                cookies[name] = value;
            }
        }
    });

    return cookies;
}

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
    return allowedOrigins.includes(normalized) || allowedOrigins.includes(origin);
}

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                if (isOriginAllowed(origin)) {
                    return callback(null, true);
                }
                return callback(new Error(`Socket CORS origin not allowed: ${origin}`), false);
            },
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const cookieHeader = socket.handshake.headers.cookie || "";
        const cookies = parseCookies(cookieHeader);
        const token = cookies.token;

        if (!token) {
            console.log("Socket authentication failed: token cookie missing");
            return next(new Error("Authentication required"));
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");
            return next(new Error("Server authentication configuration error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded.userId || !decoded.role) {
                console.log("Socket authentication failed: invalid token payload");
                return next(new Error("Invalid token payload"));
            }

            socket.user = decoded;
            next();
        } catch (error) {
            console.error(
                "Socket JWT verification failed:",
                error.name,
                error.message
            );

            return next(new Error("Invalid authentication"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.userId;

        socket.join(`user:${userId}`);

        if (socket.user.role === "pantry_staff") {
            socket.join("pantry");
        }

        console.log(`Socket connected successfully: ${userId}`);

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${userId}. Reason: ${reason}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized");
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};
