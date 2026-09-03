import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomerListPage } from "./pages/customers/CustomerListPage";
import { CustomerFormPage } from "./pages/customers/CustomerFormPage";
import { CustomerDetailPage } from "./pages/customers/CustomerDetailPage";
import { ProductListPage } from "./pages/products/ProductListPage";
import { ProductFormPage } from "./pages/products/ProductFormPage";
import { ProductDetailPage } from "./pages/products/ProductDetailPage";
import { ChallanListPage } from "./pages/challans/ChallanListPage";
import { ChallanFormPage } from "./pages/challans/ChallanFormPage";
import { ChallanDetailPage } from "./pages/challans/ChallanDetailPage";
function Layout({ children }: { children: React.ReactNode }) {
return (
<>
<Navbar />
<main>{children}</main>
</>
);
}
export default function App() {
return (
<BrowserRouter>
<AuthProvider>
<Routes>
<Route path="/login" element={<LoginPage />} />
<Route
path="/"
element={
<ProtectedRoute>
<Layout>
<DashboardPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/customers"
element={
<ProtectedRoute>
<Layout>
<CustomerListPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/customers/new"
element={
<ProtectedRoute roles={["ADMIN", "SALES"]}>
<Layout>
<CustomerFormPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/customers/:id/edit"
element={
<ProtectedRoute roles={["ADMIN", "SALES"]}>
<Layout>
<CustomerFormPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/customers/:id"
element={
<ProtectedRoute>
<Layout>
<CustomerDetailPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/products"
element={
<ProtectedRoute>
<Layout>
<ProductListPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/products/new"
element={
<ProtectedRoute roles={["ADMIN", "WAREHOUSE"]}>
<Layout>
<ProductFormPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/products/:id/edit"

element={
<ProtectedRoute roles={["ADMIN", "WAREHOUSE"]}>
<Layout>
<ProductFormPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/products/:id"
element={
<ProtectedRoute>
<Layout>
<ProductDetailPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/challans"
element={
<ProtectedRoute>
<Layout>
<ChallanListPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/challans/new"
element={
<ProtectedRoute roles={["ADMIN", "SALES"]}>
<Layout>
<ChallanFormPage />
</Layout>
</ProtectedRoute>
}
/>
<Route
path="/challans/:id"
element={
<ProtectedRoute>
<Layout>
<ChallanDetailPage />
</Layout>
</ProtectedRoute>
}
/>
</Routes>
</AuthProvider>
</BrowserRouter>
);
}
