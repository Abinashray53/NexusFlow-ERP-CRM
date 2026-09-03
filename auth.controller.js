"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool_1 = require("../../db/pool");
const jwt_1 = require("../../utils/jwt");
const AppError_1 = require("../../utils/AppError");
async function login(req, res) {
    const { email, password } = req.body;
    const result = await pool_1.pool.query(`SELECT id, name, email, password_hash, role FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];
    if (!user)
        throw new AppError_1.AppError("Invalid email or password", 401);
    const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isValid)
        throw new AppError_1.AppError("Invalid email or password", 401);
    const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role, email: user.email });
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}
async function me(req, res) {
    const result = await pool_1.pool.query(`SELECT id, name, email, role, created_at FROM users WHERE id = $1`, [req.user.userId]);
    const user = result.rows[0];
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    res.json(user);
}
