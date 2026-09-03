# NexusFlow ERP + CRM Operations Portal
A small ERP/CRM system for a wholesale/distribution company: customers, products/stock,
and sales challans, with role-based access for Admin, Sales, Warehouse and Accounts users.
Built with:
- **Backend:** Node.js, TypeScript, Express, PostgreSQL (raw `pg`, hand-written SQL migrations, no ORM)
- **Frontend:** React, TypeScript, Vite, plain CSS
- **Auth:** JWT, role-based route guards on both the API and the UI
## 1. Project structure
```
nexusflow-erp-crm/
backend/
src/
db/ schema.sql (migration), pool.ts, migrate.ts, seed.ts
middleware/ auth.ts, validate.ts, errorHandler.ts
modules/
auth/ login
customers/ CRM
products/ inventory
challans/ sales challans + stock deduction logic
utils/ AppError, asyncHandler, jwt
app.ts, server.ts
frontend/
src/
api/ axios client
context/ AuthContext
components/ Navbar, ProtectedRoute
pages/ Login, Dashboard, Customers, Products, Challans
App.tsx, main.tsx, styles.css
postman_collection.json
README.md
```
## 2. Local setup
### Prerequisites
- Node.js 18+
- A PostgreSQL database (local install, or a free hosted one - see Deployment below)
### Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, and JWT_SECRET to any long random string
npm run migrate # creates all tables
npm run seed # creates one login per role + sample products/customer
npm run dev # starts the API on http://localhost:4000
```
### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:4000
npm run dev # starts the UI on http://localhost:5173
```
Open `http://localhost:5173` and log in with one of the seeded accounts below.
## 3. Test login credentials (all roles)
Created by `npm run seed`. Password is the same for all of them.
| Role | Email | Password |
|-----------|----------------------------|----------------|
| Admin | admin@minierp.test | Password123! |
| Sales | sales@minierp.test | Password123! |
| Warehouse | warehouse@minierp.test | Password123! |
| Accounts | accounts@minierp.test | Password123! |
Accounts currently has read-only access (view everything, no create/edit) - see
Assumptions below.
## 4. Environment variables
**Backend (`backend/.env`)**
| Variable | Description |
|-----------------|----------------------------------------------------------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Long random string used to sign JWTs |
| `PORT` | Port the API listens on (default 4000) |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
**Frontend (`frontend/.env`)**
| Variable | Description |
|-----------------|------------------------------------------------------------|
| `VITE_API_URL` | URL of the backend API (no trailing slash) |
## 5. Deployment (free hosting, no AWS needed)
**Database - Neon (or Supabase / Render Postgres):**
1. Create a free Postgres project at neon.tech.
2. Copy the connection string it gives you.
**Backend - Render (or Railway / Fly.io):**
1. Push this repo to GitHub.
2. New Web Service on Render, point it at `backend/`.
3. Build command: `npm install && npm run build`
4. Start command: `npm run migrate && npm run seed && npm start`

(the migrate/seed step is idempotent - safe to run on every deploy)
5. Add environment variables: `DATABASE_URL` (from Neon), `JWT_SECRET`, `CORS_ORIGIN` (your Vercel URL once you have it).
**Frontend - Vercel (or Netlify):**
1. New Project on Vercel, point it at `frontend/`.
2. Framework preset: Vite.
3. Add environment variable `VITE_API_URL` = your Render backend URL.
4. Deploy, then go back to the backend's `CORS_ORIGIN` and set it to this Vercel URL.
AWS was intentionally skipped (it's marked optional/bonus in the brief) in favor of
this free-tier flow, which is faster to get live under a tight deadline.
## 6. API overview
All endpoints except `/auth/login` require `Authorization: Bearer <token>`.
See `postman_collection.json` for a ready-to-import collection with every endpoint
and example bodies.
| Method | Endpoint | Roles allowed | Notes |
|--------|------------------------------------|---------------------------------|-------|
| POST | /auth/login | public | |
| GET | /auth/me | any logged-in user | |
| GET | /customers | any | `?search=&status=&page=&limit=` |
| POST | /customers | ADMIN, SALES | |
| GET | /customers/:id | any | includes notes + recent challans |
| PUT | /customers/:id | ADMIN, SALES | |
| POST | /customers/:id/notes | ADMIN, SALES | follow-up notes |
| GET | /products | any | `?search=&lowStock=true&page=&limit=` |
| POST | /products | ADMIN, WAREHOUSE | |
| GET | /products/:id | any | includes stock movement log |
| PUT | /products/:id | ADMIN, WAREHOUSE | stock qty NOT editable here |
| POST | /products/:id/stock-movements | ADMIN, WAREHOUSE | IN/OUT, logged, can't go negative |
| GET | /challans | any | `?search=&status=&page=&limit=` |
| POST | /challans | ADMIN, SALES | create as DRAFT or CONFIRMED |
| GET | /challans/:id | any | |
| PATCH | /challans/:id/confirm | ADMIN, SALES, WAREHOUSE | deducts stock, atomic |
| PATCH | /challans/:id/cancel | ADMIN, SALES | only from DRAFT |
## 7. Architecture notes
- **No ORM.** The backend uses raw parameterized SQL via `pg` rather than Prisma/Sequelize.
`src/db/schema.sql` is the single source of truth for the schema and is applied with a
small `migrate.ts` runner (`npm run migrate`). This keeps the stack to plain, well-understood
pieces with no extra build step or generated client.
- **Stock integrity.** Every place stock changes (manual adjustment, challan confirm) runs
inside a Postgres transaction that `SELECT ... FOR UPDATE`-locks the product row(s) first,
checks there's enough stock, then updates stock and inserts the `stock_movements` row together.
If anything fails, the whole transaction rolls back - stock and its log can never drift apart,
and stock can never go negative even under concurrent requests.
- **Challan snapshotting.** `challan_items` stores `product_name`, `product_sku` and `unit_price`
at the time the line was created, not just a foreign key - so a challan stays accurate even if
a product is renamed or repriced later.
- **Validation.** Every request body is validated with `zod` before it reaches a controller;
failures return `400` with a field-by-field message.
- **Errors.** A single `errorHandler` middleware turns thrown `AppError`s and known Postgres
error codes (unique violation, FK violation, check violation) into consistent
`{ "error": "..." }` JSON responses with the right HTTP status.
## 8. Assumptions made
- "Accounts" role is read-only across all modules for this scope (the brief lists it as a
role but doesn't specify accounts-specific actions).
- A challan can only be cancelled while it's still a `DRAFT`. A `CONFIRMED` challan has
already affected stock, and the brief doesn't specify a restock-on-cancel flow, so that
was left out rather than guessed at.
- Challan numbers are generated sequentially as `CH-000001`, `CH-000002`, ...
- Customer "notes" are a list of timestamped entries (each with the note text and who added
it) rather than a single free-text field, since the brief asks for an "add follow-up notes"
feature.
## 9. Known limitations
- No automated test suite (out of scope given the timeline) - manually verified via the flows
in `postman_collection.json`.
- No PDF export, S3 image upload, Docker, or CI/CD pipeline - these are listed as bonus in the
brief and were skipped to focus on the required modules.
- Pagination/search is offset-based, fine at this data scale but not optimized for very large tables.

## 10. GitHub and deployment readiness

This repository is ready to push as-is. It includes lockfiles, a GitHub Actions build check, Dependabot updates, Docker production images, a Docker Compose local stack, a Render API/database blueprint, and a Vercel single-page-app routing configuration.

### One-time GitHub hand-off

1. Create an empty GitHub repository named NexusFlow-ERP-CRM. Do not add a README or .gitignore on GitHub.
2. In this project folder, run: git init
3. Run: git add .
4. Run: git commit -m "Initial deployable NexusFlow ERP and CRM portal"
5. Add your GitHub remote and push the main branch.

Secrets are never committed. Copy backend/.env.example to backend/.env and frontend/.env.example to frontend/.env for local work. Use unique production values for DATABASE_URL, JWT_SECRET, CORS_ORIGIN, and VITE_API_URL in the hosting dashboards.

### Local production-like run

With Docker Desktop installed, set a strong JWT_SECRET in a local .env file at the repository root, then run docker compose up --build. Open http://localhost:8080. The API health endpoint is http://localhost:4000/health.

### Hosted deployment

1. Create a PostgreSQL database with Render or Neon.
2. Deploy backend/ to Render with npm ci and npm run build as the build command, and npm run migrate:prod && npm run seed:prod && npm start as the start command. render.yaml provides the same configuration for a Render Blueprint.
3. Deploy frontend/ to Vercel with VITE_API_URL set to the deployed API URL.
4. Set the backend CORS_ORIGIN to the exact deployed Vercel URL, then redeploy the API.

Before sharing the portal, replace the development seed-user password or remove the seed command from the deployment start command after initial provisioning.
