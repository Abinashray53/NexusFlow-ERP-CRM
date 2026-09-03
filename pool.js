"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
// A single shared connection pool for the whole app.
// SSL is required by most managed Postgres hosts (Neon, Supabase, Render)
// but must be off for a plain local Postgres - DATABASE_URL's ?sslmode
// query param on the hosted providers handles this automatically, so we
// only force SSL here when NOT pointing at localhost.
const isLocal = (process.env.DATABASE_URL || "").includes("localhost");
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
});
