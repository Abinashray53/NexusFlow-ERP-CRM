# NexusFlow-ERP-CRM
Operations Portal: Mini ERP + CRM SystemAn production-ready, high-density mini ERP and CRM operations gateway built specifically for wholesale and distribution companies. 

The ecosystem uses a layered architecture to separate concerns, isolate business policies, and protect data integrity.                  ┌────────────────────────────────────────┐
                  │          React Client SPA UI           │
                  │  (Role-Protected Dashboard Framework)  │
                  └───────────────────┬────────────────────┘
                                      │
                                      │ Secured HTTPS REST Traffic
                                      ▼
                  ┌────────────────────────────────────────┐
                  │      Express.js API Layer Gateway      │
                  │  (JWT Guard, Route & Request Validator)│
                  └───────────────────┬────────────────────┘
                                      │
                                      │ Structured ORM Queries
                                      ▼
                  ┌────────────────────────────────────────┐
                  │    PostgreSQL Enterprise Core Engine   │
                  │ (Strict Transactions / Snapshot Logs) │
                  └────────────────────────────────────────┘
💎 Core Module Implementations1. Authentication & RBAC GuardToken Issuance: Generates stateless JSON Web Tokens containing authorization boundaries and user payloads.Role Protection: Route guards prevent privilege escalation on both the frontend layout tree and backend endpoints.2. CRM EngineCustomer Profiles: Tracks names, cell data, emails, addresses, enterprise metadata, and optional GST numbers.Audience Profiling: Groups entities by pricing agreements into Retail, Wholesale, and Distributor channels.Pipeline Status Tracking: Tracks business health dynamically using state attributes (Lead | Active | Inactive).3. Inventory & AuditsInventory Trackers: Identifies item statuses across locations using SKU codes, core categories, pricing, and stock metrics.Low Stock Alerts: Flags items automatically when inventory falls below minimum buffer volumes.Stock Ledger Logs: Records an immutable trail (IN / OUT) stating quantities changed, reasons, actions, and identities.4. Sales Challan SystemComposition: Compiles clean line-item collections with transactional snapshot calculations.Snapshot Architecture: Locks the historical price and product details into JSONB fields at compilation time to insulate documents against future catalog adjustments.Concurrency Validations: Drops transaction isolation limits during confirmation to safely verify inventory availability and prevent overselling.🛠️ Tech StackBackend Core PipelineTechnologyFunctionalityImplementation ContextNode.jsRuntime EnvironmentHigh-throughput async non-blocking core processing engine.TypeScriptType SafetyEnforces strict API schemas and interface contracts across modules.Express.jsWeb FrameworkManages REST request routing pipelines and specialized custom logic filters.PostgreSQLRelational DatabaseHandles relational constraints, complex joins, and transactional database states.Prisma ORMDatabase MappingSimplifies object-relational mapping, database migrations, and schema validation.Frontend UI LayoutTechnologyFunctionalityImplementation ContextReactUI LibraryRenders the entire modular view framework and interactive layout states.Tailwind CSSVisual DesignProvides responsive layouts, clean structures, and consistent look-and-feel themes.ZustandState ControlOrchestrates global stores, reactive cache policies, and user contexts.AxiosClient RequestsPowers API communications with automatic interceptors for JWT injection.📂 Project Directory Map/
├── backend/                  # Monolith Backend Engine Core
│   ├── src/
│   │   ├── config/           # Database pools, server setups, and environment bindings
│   │   ├── controllers/      # Route request terminators and payload orchestrators
│   │   ├── middleware/       # Authentication filters and verification engines
│   │   ├── models/           # Data design validation definitions
│   │   ├── routes/           # Global endpoints and router maps
│   │   ├── services/         # Business domain processing systems
│   │   └── app.ts            # Core express initialization setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Client UI SPA Single Page Application
│   ├── src/
│   │   ├── assets/           # Global static design media assets
│   │   ├── components/       # Reusable layout building blocks
│   │   ├── context/          # Authentication tracking definitions
│   │   ├── pages/            # Application view pages
│   │   ├── services/         # API consumer configuration endpoints
│   │   └── App.tsx           # Layout route control hub
│   ├── package.json
│   └── tailwind.config.js
└── README.md
📋 Comprehensive Database Blueprintsql-- Enums Configuration
CREATE TYPE user_role AS ENUM ('Admin', 'Sales', 'Warehouse', 'Accounts');
CREATE TYPE customer_type AS ENUM ('Retail', 'Wholesale', 'Distributor');
CREATE TYPE customer_status AS ENUM ('Lead', 'Active', 'Inactive');
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE challan_status AS ENUM ('Draft', 'Confirmed', 'Cancelled');

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(100),
    type customer_type NOT NULL,
    address TEXT NOT NULL,
    status customer_status DEFAULT 'Lead',
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 10,
    warehouse_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stock Movement Log Table
CREATE TABLE stock_movement_logs (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity_changed INT NOT NULL,
    type movement_type NOT NULL,
    reason TEXT NOT NULL,
    created_by INT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sales Challans Table
CREATE TABLE sales_challans (
    id SERIAL PRIMARY KEY,
    challan_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(id),
    products_snapshot JSONB NOT NULL,
    total_quantity INT NOT NULL,
    status challan_status DEFAULT 'Draft',
    created_by INT REFERENCES users(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Use code with caution.📡 API BlueprintAuthentication PathsPOST /api/auth/login - Authenticates credentials and returns a valid JWT.Payload: { "email": "...", "password": "..." }Response: { "token": "ey...", "user": { "role": "Admin" } }Customer CRM PathsGET /api/customers - Returns a paginated list of accounts with active search and filter hooks.POST /api/customers - Adds a new enterprise profile to the system.PATCH /api/customers/:id - Updates biographical customer data or timeline notes.Inventory PathsGET /api/products - Fetches the product catalog and highlights low stock alerts.POST /api/products - Adds a new product profile to the inventory index.GET /api/products/logs - Displays an immutable audit trail of stock adjustments.Challan Operations PathsPOST /api/challans - Creates an order file in Draft or Confirmed status.PATCH /api/challans/:id/status - Promotes records to active states or cancels files safely.
