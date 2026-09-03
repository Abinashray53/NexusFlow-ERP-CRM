"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_controller_1 = require("./customers.controller");
const customers_schema_1 = require("./customers.schema");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
// All customer routes require login. Admin + Sales can create/edit;
// everyone logged in can view (warehouse/accounts often need to look up a customer).
router.use(auth_1.authenticate);
router.get("/", (0, asyncHandler_1.asyncHandler)(customers_controller_1.listCustomers));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(customers_controller_1.getCustomer));
router.post("/", (0, auth_1.authorize)("ADMIN", "SALES"), (0, validate_1.validateBody)(customers_schema_1.createCustomerSchema), (0, asyncHandler_1.asyncHandler)(customers_controller_1.createCustomer));
router.put("/:id", (0, auth_1.authorize)("ADMIN", "SALES"), (0, validate_1.validateBody)(customers_schema_1.updateCustomerSchema), (0, asyncHandler_1.asyncHandler)(customers_controller_1.updateCustomer));
router.post("/:id/notes", (0, auth_1.authorize)("ADMIN", "SALES"), (0, validate_1.validateBody)(customers_schema_1.addNoteSchema), (0, asyncHandler_1.asyncHandler)(customers_controller_1.addCustomerNote));
exports.default = router;
