"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = createCustomer;
exports.listCustomers = listCustomers;
exports.getCustomer = getCustomer;
exports.updateCustomer = updateCustomer;
exports.addCustomerNote = addCustomerNote;
const pool_1 = require("../../db/pool");
const AppError_1 = require("../../utils/AppError");
function mapCustomer(row) {
    return {
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        businessName: row.business_name,
        gstNumber: row.gst_number,
        customerType: row.customer_type,
        address: row.address,
        status: row.status,
        followUpDate: row.follow_up_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function createCustomer(req, res) {
    const d = req.body;
    const result = await pool_1.pool.query(`INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
RETURNING *`, [
        d.name,
        d.mobile,
        d.email || null,
        d.businessName || null,
        d.gstNumber || null,
        d.customerType,
        d.address || null,
        d.status,
        d.followUpDate ? new Date(d.followUpDate) : null,
    ]);
    res.status(201).json(mapCustomer(result.rows[0]));
}
async function listCustomers(req, res) {
    const page = Math.max(parseInt(String(req.query.page ?? "1")), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20")), 1), 100);
    const search = String(req.query.search ?? "").trim();
    const status = req.query.status ? String(req.query.status) : undefined;
    const conditions = [];
    const params = [];
    if (search) {
        params.push(`%${search}%`);
        const idx = params.length;
        conditions.push(`(name ILIKE $${idx} OR mobile ILIKE $${idx} OR business_name ILIKE $${idx} OR email ILIKE $${idx})`);
    }
    if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await pool_1.pool.query(`SELECT COUNT(*) FROM customers ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const dataParams = [...params, limit, (page - 1) * limit];
    const dataResult = await pool_1.pool.query(`SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
    res.json({
        items: dataResult.rows.map(mapCustomer),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
}
async function getCustomer(req, res) {
    const customerResult = await pool_1.pool.query(`SELECT * FROM customers WHERE id = $1`, [req.params.id]);
    const customer = customerResult.rows[0];
    if (!customer)
        throw new AppError_1.AppError("Customer not found", 404);
    const notesResult = await pool_1.pool.query(`SELECT cn.*, u.name as created_by_name FROM customer_notes cn
LEFT JOIN users u ON u.id = cn.created_by
WHERE cn.customer_id = $1 ORDER BY cn.created_at DESC`, [req.params.id]);
    const challansResult = await pool_1.pool.query(`SELECT id, challan_number, status, total_quantity, created_at FROM sales_challans
WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id]);
    res.json({
        ...mapCustomer(customer),
        notes: notesResult.rows.map((n) => ({
            id: n.id,
            note: n.note,
            createdAt: n.created_at,
            createdBy: n.created_by_name ? { name: n.created_by_name } : null,
        })),
        challans: challansResult.rows.map((c) => ({
            id: c.id,
            challanNumber: c.challan_number,
            status: c.status,
            totalQuantity: c.total_quantity,
            createdAt: c.created_at,
        })),
    });
}
async function updateCustomer(req, res) {
    const d = req.body;
    const existing = await pool_1.pool.query(`SELECT id FROM customers WHERE id = $1`, [req.params.id]);
    if (!existing.rows[0])
        throw new AppError_1.AppError("Customer not found", 404);
    const fields = [];
    const params = [];
    function set(column, value) {
        params.push(value);
        fields.push(`${column} = $${params.length}`);
    }
    if (d.name !== undefined)
        set("name", d.name);
    if (d.mobile !== undefined)
        set("mobile", d.mobile);
    if (d.email !== undefined)
        set("email", d.email || null);
    if (d.businessName !== undefined)
        set("business_name", d.businessName || null);
    if (d.gstNumber !== undefined)
        set("gst_number", d.gstNumber || null);
    if (d.customerType !== undefined)
        set("customer_type", d.customerType);
    if (d.address !== undefined)
        set("address", d.address || null);
    if (d.status !== undefined)
        set("status", d.status);
    if (d.followUpDate !== undefined)
        set("follow_up_date", d.followUpDate ? new Date(d.followUpDate) : null);
    fields.push(`updated_at = now()`);
    params.push(req.params.id);
    const result = await pool_1.pool.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    res.json(mapCustomer(result.rows[0]));
}
async function addCustomerNote(req, res) {
    const existing = await pool_1.pool.query(`SELECT id FROM customers WHERE id = $1`, [req.params.id]);
    if (!existing.rows[0])
        throw new AppError_1.AppError("Customer not found", 404);
    const result = await pool_1.pool.query(`INSERT INTO customer_notes (customer_id, note, created_by) VALUES ($1,$2,$3) RETURNING *`, [req.params.id, req.body.note, req.user?.userId || null]);
    res.status(201).json(result.rows[0]);
}
