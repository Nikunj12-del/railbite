const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

let io;

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173"
            ],
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const token = cookies.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            next();
        } catch (error) {
            next(new Error("Invalid authentication"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.userId;

        socket.join(`user:${userId}`);

        if (socket.user.role === "pantry_staff") {
            socket.join("pantry");
        }

        console.log(`Socket connected: ${userId}`);

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${userId}`);
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
