import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function Navbar() {
const { user, logout } = useAuth();
if (!user) return null;
return (
<header className="navbar">
<div className="navbar-brand">NexusFlow ERP + CRM</div>
<nav className="navbar-links">
<NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
Dashboard
</NavLink>
<NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
Customers
</NavLink>
<NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
Products
</NavLink>
<NavLink to="/challans" className={({ isActive }) => (isActive ? "active" : "")}>
Sales Challans
</NavLink>
</nav>
<div className="navbar-user">
<span className="badge">{user.role}</span>
<span>{user.name}</span>
<button className="btn-link" onClick={logout}>
Logout
</button>
</div>
</header>
);
}
