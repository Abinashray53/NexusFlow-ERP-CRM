export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
export interface User {
id: string;
name: string;
email: string;
role: Role;
}
export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";
export interface Customer {
id: string;
name: string;
mobile: string;
email: string | null;
businessName: string | null;
gstNumber: string | null;
customerType: CustomerType;
address: string | null;
status: CustomerStatus;
followUpDate: string | null;
createdAt: string;
updatedAt: string;
}
export interface CustomerNote {
id: string;
note: string;
createdAt: string;
createdBy: { name: string } | null;
}
export interface CustomerDetail extends Customer {
notes: CustomerNote[];
challans: { id: string; challanNumber: string; status: string; totalQuantity: number; createdAt: string }[];
}
export interface Product {
id: string;
name: string;
sku: string;
category: string | null;
unitPrice: number;
currentStock: number;
minStockAlert: number;
location: string | null;
createdAt: string;
updatedAt: string;
}
export type MovementType = "IN" | "OUT";
export interface StockMovement {
id: string;
quantity: number;
movementType: MovementType;
reason: string;
createdAt: string;
createdBy: { name: string } | null;
}
export interface ProductDetail extends Product {
stockMovements: StockMovement[];
}
export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export interface ChallanItem {
id: string;
productId: string;
productName: string;
productSku: string;
unitPrice: number;
quantity: number;
}
export interface Challan {
id: string;
challanNumber: string;
customerId: string;
totalQuantity: number;
status: ChallanStatus;
createdAt: string;
confirmedAt: string | null;
customer?: { name: string; mobile: string; email?: string | null };
items: ChallanItem[];
createdBy?: { name: string; email: string } | null;
}
export interface Paginated<T> {
items: T[];
pagination: { page: number; limit: number; total: number; totalPages: number };
}
