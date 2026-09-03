"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool_1 = require("./pool");
async function seed() {
    const passwordHash = await bcryptjs_1.default.hash("Password123!", 10);
    const users = [
        { name: "Admin User", email: "admin@minierp.test", role: "ADMIN" },
        { name: "Sales User", email: "sales@minierp.test", role: "SALES" },
        { name: "Warehouse User", email: "warehouse@minierp.test", role: "WAREHOUSE" },
        { name: "Accounts User", email: "accounts@minierp.test", role: "ACCOUNTS" },
    ];
    for (const u of users) {
        await pool_1.pool.query(`INSERT INTO users (name, email, password_hash, role)
VALUES ($1, $2, $3, $4)
ON CONFLICT (email) DO NOTHING`, [u.name, u.email, passwordHash, u.role]);
    }
    console.log("Seeded users (all use password: Password123!):", users.map((u) => `${u.role} -> ${u.email}`));
    await pool_1.pool.query(`INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (sku) DO NOTHING`, ["Steel Rod 10mm", "SKU-STEEL-001", "Raw Material", 450.0, 200, 20, "Warehouse A"]);
    await pool_1.pool.query(`INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (sku) DO NOTHING`, ["Cement Bag 50kg", "SKU-CEMENT-001", "Construction", 380.0, 500, 50, "Warehouse B"]);
    console.log("Seeded products: SKU-STEEL-001, SKU-CEMENT-001");
    await pool_1.pool.query(`INSERT INTO customers (name, mobile, email, business_name, customer_type, status, address)
SELECT $1,$2,$3,$4,$5,$6,$7
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE mobile = $2)`, ["Ramesh Traders", "9876543210", "ramesh@traders.test", "Ramesh Traders Pvt Ltd", "WHOLESALE", "ACTIVE", "MG Road, Bhubaneswar"]);
    console.log("Seeded customer: Ramesh Traders");
    await pool_1.pool.end();
}
seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
