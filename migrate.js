"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = require("./pool");
async function migrate() {
    const sql = fs_1.default.readFileSync(path_1.default.join(__dirname, "schema.sql"), "utf-8");
    console.log("Running migration against DATABASE_URL...");
    await pool_1.pool.query(sql);
    console.log("Migration complete - schema is up to date.");
    await pool_1.pool.end();
}
migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
