
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : null;

        const token = req.cookies?.token || bearerToken;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        // Temporary debugging
        console.log("AUTH USER:", {
            userId: req.user.userId,
            role: req.user.role
        });

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;
    