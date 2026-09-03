"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const AppError_1 = require("../utils/AppError");
// Validates req.body against a zod schema. On failure, throws a 400 with
// a readable message listing every field that failed.
function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors
                .map((e) => `${e.path.join(".") || "body"}: ${e.message}`)
                .join("; ");
            throw new AppError_1.AppError(`Validation error: ${message}`, 400);
        }
        req.body = result.data;
        next();
    };
}
