
const errorMiddleware = (err, req, res, next) => {
    console.error("Server Error:", err.message);

    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : err.message
    });
};

module.exports = errorMiddleware;
