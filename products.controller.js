"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.listProducts = listProducts;
exports.getProduct = getProduct;
exports.updateProduct = updateProduct;
exports.adjustStock = adjustStock;
const pool_1 = require("../../db/pool");
const AppError_1 = require("../../utils/AppError");
function mapProduct(row) {
    return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category,
        unitPrice: parseFloat(row.unit_price),
        currentStock: row.current_stock,
        minStockAlert: row.min_stock_alert,
        location: row.location,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function createProduct(req, res) {
    const d = req.body;
    const result = await pool_1.pool.query(`INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [d.name, d.sku, d.category || null, d.unitPrice, d.currentStock ?? 0, d.minStockAlert ?? 0, d.location || null]);
    res.status(201).json(mapProduct(result.rows[0]));
}
async function listProducts(req, res) {
    const page = Math.max(parseInt(String(req.query.page ?? "1")), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20")), 1), 100);
    const search = String(req.query.search ?? "").trim();
    const lowStockOnly = req.query.lowStock === "true";
    const conditions = [];
    const params = [];
    if (search) {
        params.push(`%${search}%`);
        const idx = params.length;
        conditions.push(`(name ILIKE $${idx} OR sku ILIKE $${idx} OR category ILIKE $${idx})`);
    }
    if (lowStockOnly) {
        conditions.push(`current_stock <= min_stock_alert`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await pool_1.pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const dataParams = [...params, limit, (page - 1) * limit];
    const dataResult = await pool_1.pool.query(`SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
    res.json({
        items: dataResult.rows.map(mapProduct),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
}
async function getProduct(req, res) {
    const productResult = await pool_1.pool.query(`SELECT * FROM products WHERE id = $1`, [req.params.id]);
    const product = productResult.rows[0];
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    const movementsResult = await pool_1.pool.query(`SELECT sm.*, u.name as created_by_name FROM stock_movements sm
LEFT JOIN users u ON u.id = sm.created_by
WHERE sm.product_id = $1 ORDER BY sm.created_at DESC LIMIT 30`, [req.params.id]);
    res.json({
        ...mapProduct(product),
        stockMovements: movementsResult.rows.map((m) => ({
            id: m.id,
            quantity: m.quantity,
            movementType: m.movement_type,
            reason: m.reason,
            createdAt: m.created_at,
            createdBy: m.created_by_name ? { name: m.created_by_name } : null,
        })),
    });
}
async function updateProduct(req, res) {
    const d = req.body;
    const existing = await pool_1.pool.query(`SELECT id FROM products WHERE id = $1`, [req.params.id]);
    if (!existing.rows[0])
        throw new AppError_1.AppError("Product not found", 404);
    const fields = [];
    const params = [];
    function set(column, value) {
        params.push(value);
        fields.push(`${column} = $${params.length}`);
    }
    if (d.name !== undefined)
        set("name", d.name);
    if (d.sku !== undefined)
        set("sku", d.sku);
    if (d.category !== undefined)
        set("category", d.category || null);
    if (d.unitPrice !== undefined)
        set("unit_price", d.unitPrice);
    if (d.minStockAlert !== undefined)
        set("min_stock_alert", d.minStockAlert);
    if (d.location !== undefined)
        set("location", d.location || null);
    // currentStock is intentionally NOT editable here - it only changes
    // through the stock-movements endpoint below, so every change is logged.
    fields.push(`updated_at = now()`);
    params.push(req.params.id);
    const result = await pool_1.pool.query(`UPDATE products SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    res.json(mapProduct(result.rows[0]));
}
// Manual stock adjustment (e.g. new stock arrived, damaged goods written off).
// Runs in a transaction with a row lock so the stock number and the log
// entry never go out of sync, and stock can never go negative even under
// concurrent requests.
async function adjustStock(req, res) {
    const { quantity, movementType, reason } = req.body;
    const productId = req.params.id;
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const productResult = await client.query(`SELECT * FROM products WHERE id = $1 FOR UPDATE`, [productId]);
        const product = productResult.rows[0];
        if (!product)
            throw new AppError_1.AppError("Product not found", 404);
        const newStock = movementType === "IN" ? product.current_stock + quantity : product.current_stock - quantity;
        if (newStock < 0) {
            throw new AppError_1.AppError(`Insufficient stock for ${product.name}. Available: ${product.current_stock}, requested OUT: ${quantity}`, 409);
        }
        const updateResult = await client.query(`UPDATE products SET current_stock = $1, updated_at = now() WHERE id = $2 RETURNING *`, [newStock, productId]);
        const movementResult = await client.query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
VALUES ($1,$2,$3,$4,$5) RETURNING *`, [productId, quantity, movementType, reason, req.user?.userId || null]);
        await client.query("COMMIT");
        res.status(201).json({
            product: mapProduct(updateResult.rows[0]),
            movement: movementResult.rows[0],
        });
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
