"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../utils/AppError");
// This must be registered LAST, after all routes, and it must have 4 args
// so Express recognizes it as an error handler.
function errorHandler(err, _req, res, _next) {
    // Errors we threw on purpose (validation, business rules, auth, etc.)
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    // Common Postgres error codes - see https://www.postgresql.org/docs/current/errcodes-appendix.html
    const pgErr = err;
    if (pgErr && pgErr.code) {
        if (pgErr.code === "23505") {
            const field = (pgErr.constraint || "value")
                .replace(/^(users|products|customers|sales_challans)_/, "")
                .replace(/_key$/, "")
                .replace(/_/g, " ");
            return res.status(409).json({ error: `A record with this ${field} already exists.` });
        }
        if (pgErr.code === "23503") {
            return res.status(400).json({ error: "Referenced record does not exist." });
        }
        if (pgErr.code === "23514") {
            return res.status(400).json({ error: "Value violates a database constraint." });
        }
        if (pgErr.code === "22P02") {
            return res.status(400).json({ error: "Invalid identifier format." });
        }
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
}
