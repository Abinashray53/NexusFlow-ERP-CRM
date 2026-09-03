import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Paginated, Product, Challan } from "../types";
export function DashboardPage() {
const { user } = useAuth();
const [lowStock, setLowStock] = useState<Product[]>([]);
const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
const [customerCount, setCustomerCount] = useState<number | null>(null);
const [productCount, setProductCount] = useState<number | null>(null);
useEffect(() => {
api.get<Paginated<Product>>("/products?lowStock=true&limit=5").then((r) => setLowStock(r.data.items));
api.get<Paginated<Challan>>("/challans?limit=5").then((r) => setRecentChallans(r.data.items));
api.get<Paginated<unknown>>("/customers?limit=1").then((r) => setCustomerCount(r.data.pagination.total));
api.get<Paginated<unknown>>("/products?limit=1").then((r) => setProductCount(r.data.pagination.total));
}, []);
return (
<div className="page">
<h1>Welcome, {user?.name}</h1>
<div className="stat-grid">
<div className="card stat-card">
<div className="stat-value">{customerCount ?? "..."}</div>
<div className="stat-label">Customers</div>
</div>
<div className="card stat-card">
<div className="stat-value">{productCount ?? "..."}</div>
<div className="stat-label">Products</div>
</div>
<div className="card stat-card">
<div className="stat-value">{lowStock.length}</div>
<div className="stat-label">Low Stock Alerts</div>
</div>
</div>
<div className="two-col">
<div className="card">
<h3>Low Stock Products</h3>
{lowStock.length === 0 ? (
<p className="muted">Nothing low on stock right now.</p>
) : (
<table className="table">
<thead>
<tr>
<th>Product</th>
<th>Stock</th>
<th>Alert level</th>
</tr>
</thead>
<tbody>
{lowStock.map((p) => (
<tr key={p.id}>
<td>
<Link to={`/products/${p.id}`}>{p.name}</Link>
</td>
<td className="text-danger">{p.currentStock}</td>
<td>{p.minStockAlert}</td>
</tr>
))}
</tbody>
</table>
)}
</div>
<div className="card">
<h3>Recent Sales Challans</h3>
{recentChallans.length === 0 ? (
<p className="muted">No challans yet.</p>
) : (
<table className="table">
<thead>
<tr>
<th>Challan #</th>
<th>Customer</th>
<th>Status</th>
</tr>
</thead>
<tbody>
{recentChallans.map((c) => (
<tr key={c.id}>
<td>
<Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
</td>
<td>{c.customer?.name}</td>
<td>
<span className={`status status-${c.status.toLowerCase()}`}>{c.status}</span>
</td>
</tr>
))}
</tbody>
</table>
)}
</div>
</div>
</div>
);
}
