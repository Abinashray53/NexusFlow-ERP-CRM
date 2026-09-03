import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function LoginPage() {
const { login, user, loading } = useAuth();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const navigate = useNavigate();
if (user) return <Navigate to="/" replace />;
async function handleSubmit(e: FormEvent) {
e.preventDefault();
setError("");
try {
await login(email, password);
navigate("/");
} catch (err) {
setError(err instanceof Error ? err.message : "Login failed");
}
}
return (
<div className="auth-page">
<form className="card auth-card" onSubmit={handleSubmit}>
<h1>NexusFlow ERP + CRM</h1>
<p className="muted">Sign in to continue</p>
{error && <div className="alert alert-error">{error}</div>}
<label>
Email
<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
</label>
<label>
Password
<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
</label>
<button type="submit" className="btn-primary" disabled={loading}>
{loading ? "Signing in..." : "Sign in"}
</button>
<div className="demo-creds">
<p className="muted">Demo logins (password: Password123!)</p>
<ul>
<li>admin@minierp.test</li>
<li>sales@minierp.test</li>
<li>warehouse@minierp.test</li>
<li>accounts@minierp.test</li>
</ul>
</div>
</form>
</div>
);
}
