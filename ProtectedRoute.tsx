import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";
export function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Role[] }) {
const { user } = useAuth();
if (!user) {
return <Navigate to="/login" replace />;
}
if (roles && !roles.includes(user.role)) {
return (
<div className="page">
<div className="card">
<h2>Access denied</h2>
<p>Your role ({user.role}) doesn't have permission to view this page.</p>
</div>
</div>
);
}
return children;
}
