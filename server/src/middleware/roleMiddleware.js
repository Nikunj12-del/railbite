const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        console.log("ROLE CHECK:", {
            actual: req.user?.role,
            required: requiredRole
        });

        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = roleMiddleware;