"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const customers_routes_1 = __importDefault(require("./modules/customers/customers.routes"));
const products_routes_1 = __importDefault(require("./modules/products/products.routes"));
const challans_routes_1 = __importDefault(require("./modules/challans/challans.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
exports.app = (0, express_1.default)();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());
exports.app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
exports.app.use(express_1.default.json());
exports.app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
exports.app.use("/auth", auth_routes_1.default);
exports.app.use("/customers", customers_routes_1.default);
exports.app.use("/products", products_routes_1.default);
exports.app.use("/challans", challans_routes_1.default);
exports.app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});
// Must be registered last.
exports.app.use(errorHandler_1.errorHandler);
