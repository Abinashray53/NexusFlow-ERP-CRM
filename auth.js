"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_1 = require("../utils/jwt");
const AppError_1 = require("../utils/AppError");
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new AppError_1.AppError("Authentication token missing", 401);
    }
    const token = header.split(" ")[1];
    try {
        req.user = (0, jwt_1.verifyToken)(token);
        next();
    }
    catch {
        throw new AppError_1.AppError("Invalid or expired token", 401);
    }
}
// Usage: authorize("ADMIN", "SALES")
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw new AppError_1.AppError("Authentication required", 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError_1.AppError("You do not have permission to perform this action", 403);
        }
        next();
    };
}
