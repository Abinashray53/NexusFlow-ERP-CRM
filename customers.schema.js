"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNoteSchema = exports.updateCustomerSchema = exports.createCustomerSchema = exports.customerStatusEnum = exports.customerTypeEnum = void 0;
const zod_1 = require("zod");
exports.customerTypeEnum = zod_1.z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
exports.customerStatusEnum = zod_1.z.enum(["LEAD", "ACTIVE", "INACTIVE"]);
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    mobile: zod_1.z.string().min(6, "Mobile number is required"),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    businessName: zod_1.z.string().optional(),
    gstNumber: zod_1.z.string().optional(),
    customerType: exports.customerTypeEnum.default("RETAIL"),
    address: zod_1.z.string().optional(),
    status: exports.customerStatusEnum.default("LEAD"),
    followUpDate: zod_1.z.string().datetime().optional().or(zod_1.z.literal("")),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
exports.addNoteSchema = zod_1.z.object({
    note: zod_1.z.string().min(1, "Note text is required"),
});
