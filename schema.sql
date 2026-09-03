-- NexusFlow ERP + CRM database schema.
-- Safe to re-run: every statement checks for existence first.
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gives us gen_random_uuid()
DO $$ BEGIN
CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE customer_type AS ENUM ('RETAIL', 'WHOLESALE', 'DISTRIBUTOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE customer_status AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE challan_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role user_role NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customers (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
mobile TEXT NOT NULL,
email TEXT,
business_name TEXT,
gst_number TEXT,
customer_type customer_type NOT NULL DEFAULT 'RETAIL',
address TEXT,
status customer_status NOT NULL DEFAULT 'LEAD',
follow_up_date TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_notes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
note TEXT NOT NULL,
created_by UUID REFERENCES users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
sku TEXT NOT NULL UNIQUE,
category TEXT,
unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
min_stock_alert INTEGER NOT NULL DEFAULT 0,
location TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stock_movements (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
product_id UUID NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
movement_type movement_type NOT NULL,
reason TEXT NOT NULL,
created_by UUID REFERENCES users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sales_challans (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
challan_number TEXT NOT NULL UNIQUE,
customer_id UUID NOT NULL REFERENCES customers(id),
total_quantity INTEGER NOT NULL DEFAULT 0,
status challan_status NOT NULL DEFAULT 'DRAFT',
created_by UUID REFERENCES users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
confirmed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS challan_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
challan_id UUID NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
product_id UUID NOT NULL REFERENCES products(id),
product_name TEXT NOT NULL,
product_sku TEXT NOT NULL,
unit_price NUMERIC(10,2) NOT NULL,
quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_challans_customer ON sales_challans (customer_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items (challan_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);
