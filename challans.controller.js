"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChallan = createChallan;
exports.listChallans = listChallans;
exports.getChallan = getChallan;
exports.confirmChallan = confirmChallan;
exports.cancelChallan = cancelChallan;
const pool_1 = require("../../db/pool");
const AppError_1 = require("../../utils/AppError");
async function generateChallanNumber(client) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM sales_challans`);
    const next = result.rows[0].count + 1;
    return `CH-${String(next).padStart(6, "0")}`;
}
function mapChallan(row) {
    return {
        id: row.id,
        challanNumber: row.challan_number,
        customerId: row.customer_id,
        totalQuantity: row.total_quantity,
        status: row.status,
        createdAt: row.created_at,
        confirmedAt: row.confirmed_at,
    };
}
function mapChallanItem(row) {
    return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productSku: row.product_sku,
        unitPrice: parseFloat(row.unit_price),
        quantity: row.quantity,
    };
}
// Locks every product row involved, checks stock is sufficient for ALL
// lines first (so the error message lists every problem at once, not just
// the first one hit), then deducts stock and logs a StockMovement per
// line. Must be called inside an already-open transaction.
async function deductStockForItems(client, items, challanNumber, userId) {
    const sortedIds = [...new Set(items.map((i) => i.productId))].sort();
    const productsResult = await client.query(`SELECT * FROM products WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [sortedIds]);
    const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));
    const problems = [];
    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            problems.push(`Product ${item.productName} no longer exists`);
            continue;
        }
        if (product.current_stock < item.quantity) {
            problems.push(`${product.name}: requested ${item.quantity}, only ${product.current_stock} in stock`);
        }
    }
    if (problems.length > 0) {
        throw new AppError_1.AppError(`Cannot confirm challan - insufficient stock: ${problems.join("; ")}`, 409);
    }
    for (const item of items) {
        const product = productMap.get(item.productId);
        const newStock = product.current_stock - item.quantity;
        await client.query(`UPDATE products SET current_stock = $1, updated_at = now() WHERE id = $2`, [
            newStock,
            item.productId,
        ]);
        product.current_stock = newStock; // keep in sync if the same product appears twice
        await client.query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
VALUES ($1,$2,'OUT',$3,$4)`, [item.productId, item.quantity, `Sales Challan ${challanNumber}`, userId || null]);
    }
}
async function createChallan(req, res) {
    const { customerId, items, status } = req.body;
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const customerResult = await client.query(`SELECT id FROM customers WHERE id = $1`, [customerId]);
        if (!customerResult.rows[0])
            throw new AppError_1.AppError("Customer not found", 404);
        const productIds = [...new Set(items.map((i) => i.productId))];
        const productsResult = await client.query(`SELECT * FROM products WHERE id = ANY($1::uuid[])`, [productIds]);
        const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));
        for (const item of items) {
            if (!productMap.has(item.productId)) {
                throw new AppError_1.AppError(`Product ${item.productId} not found`, 404);
            }
        }
        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
        const challanNumber = await generateChallanNumber(client);
        const challanResult = await client.query(`INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by, confirmed_at)
VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [
            challanNumber,
            customerId,
            totalQuantity,
            status,
            req.user?.userId || null,
            status === "CONFIRMED" ? new Date() : null,
        ]);
        const challan = challanResult.rows[0];
        const itemRows = [];
        for (const item of items) {
            const p = productMap.get(item.productId);
            const itemResult = await client.query(`INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [challan.id, p.id, p.name, p.sku, p.unit_price, item.quantity]);
            itemRows.push(itemResult.rows[0]);
        }
        if (status === "CONFIRMED") {
            await deductStockForItems(client, itemRows.map((i) => ({ productId: i.product_id, quantity: i.quantity, productName: i.product_name })), challanNumber, req.user?.userId);
        }
        await client.query("COMMIT");
        res.status(201).json({ ...mapChallan(challan), items: itemRows.map(mapChallanItem) });
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
async function listChallans(req, res) {
    const page = Math.max(parseInt(String(req.query.page ?? "1")), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20")), 1), 100);
    const search = String(req.query.search ?? "").trim();
    const status = req.query.status ? String(req.query.status) : undefined;
    const conditions = [];
    const params = [];
    if (search) {
        params.push(`%${search}%`);
        const idx = params.length;
        conditions.push(`(sc.challan_number ILIKE $${idx} OR c.name ILIKE $${idx})`);
    }
    if (status) {
        params.push(status);
        conditions.push(`sc.status = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await pool_1.pool.query(`SELECT COUNT(*) FROM sales_challans sc JOIN customers c ON c.id = sc.customer_id ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const dataParams = [...params, limit, (page - 1) * limit];
    const dataResult = await pool_1.pool.query(`SELECT sc.*, c.name as customer_name, c.mobile as customer_mobile
FROM sales_challans sc JOIN customers c ON c.id = sc.customer_id
${whereClause}
ORDER BY sc.created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
    res.json({
        items: dataResult.rows.map((r) => ({
            ...mapChallan(r),
            customer: { name: r.customer_name, mobile: r.customer_mobile },
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
}
async function getChallan(req, res) {
    const challanResult = await pool_1.pool.query(`SELECT sc.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
u.name as created_by_name, u.email as created_by_email
FROM sales_challans sc
JOIN customers c ON c.id = sc.customer_id
LEFT JOIN users u ON u.id = sc.created_by
WHERE sc.id = $1`, [req.params.id]);
    const challan = challanResult.rows[0];
    if (!challan)
        throw new AppError_1.AppError("Challan not found", 404);
    const itemsResult = await pool_1.pool.query(`SELECT * FROM challan_items WHERE challan_id = $1`, [req.params.id]);
    res.json({
        ...mapChallan(challan),
        customer: { name: challan.customer_name, mobile: challan.customer_mobile, email: challan.customer_email },
        createdBy: challan.created_by_name ? { name: challan.created_by_name, email: challan.created_by_email } : null,
        items: itemsResult.rows.map(mapChallanItem),
    });
}
async function confirmChallan(req, res) {
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const challanResult = await client.query(`SELECT * FROM sales_challans WHERE id = $1 FOR UPDATE`, [
            req.params.id,
        ]);
        const challan = challanResult.rows[0];
        if (!challan)
            throw new AppError_1.AppError("Challan not found", 404);
        if (challan.status !== "DRAFT") {
            throw new AppError_1.AppError(`Only DRAFT challans can be confirmed (current status: ${challan.status})`, 400);
        }
        const itemsResult = await client.query(`SELECT * FROM challan_items WHERE challan_id = $1`, [challan.id]);
        await deductStockForItems(client, itemsResult.rows.map((i) => ({ productId: i.product_id, quantity: i.quantity, productName: i.product_name })), challan.challan_number, req.user?.userId);
        const updateResult = await client.query(`UPDATE sales_challans SET status = 'CONFIRMED', confirmed_at = now() WHERE id = $1 RETURNING *`, [challan.id]);
        await client.query("COMMIT");
        res.json({ ...mapChallan(updateResult.rows[0]), items: itemsResult.rows.map(mapChallanItem) });
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
async function cancelChallan(req, res) {
    const existing = await pool_1.pool.query(`SELECT * FROM sales_challans WHERE id = $1`, [req.params.id]);
    if (!existing.rows[0])
        throw new AppError_1.AppError("Challan not found", 404);
    if (existing.rows[0].status !== "DRAFT") {
        throw new AppError_1.AppError("Only DRAFT challans can be cancelled. Confirmed challans already affected stock.", 400);
    }
    const result = await pool_1.pool.query(`UPDATE sales_challans SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [
        req.params.id,
    ]);
    res.json(mapChallan(result.rows[0]));
}
