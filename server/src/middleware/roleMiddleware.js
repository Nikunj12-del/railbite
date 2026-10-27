const roleMiddleware = (requiredRoles) => {
    const allowedRoles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = roleMiddleware;