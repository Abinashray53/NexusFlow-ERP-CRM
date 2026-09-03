"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockAdjustSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    sku: zod_1.z.string().min(1, "SKU is required"),
    category: zod_1.z.string().optional(),
    unitPrice: zod_1.z.number().nonnegative("Unit price must be 0 or more"),
    currentStock: zod_1.z.number().int().nonnegative().default(0),
    minStockAlert: zod_1.z.number().int().nonnegative().default(0),
    location: zod_1.z.string().optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.stockAdjustSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().positive("Quantity must be greater than 0"),
    movementType: zod_1.z.enum(["IN", "OUT"]),
    reason: zod_1.z.string().min(1, "Reason is required"),
});
