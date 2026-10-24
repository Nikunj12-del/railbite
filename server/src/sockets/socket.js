
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function parseCookies(cookieHeader) {
    const cookies = {};

    cookieHeader.split(";").forEach((cookieString) => {
        const separatorIndex = cookieString.indexOf("=");

        if (separatorIndex === -1) {
            return;
        }

        const name = cookieString.slice(0, separatorIndex).trim();
        const value = cookieString.slice(separatorIndex + 1).trim();

        if (name) {
            cookies[name] = decodeURIComponent(value);
        }
    });

    return cookies;
}

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
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
