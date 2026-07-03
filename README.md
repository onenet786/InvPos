# InvPos — Inventory & Point-of-Sale Management System

A complete inventory and POS management system built with Node.js, Express, PostgreSQL, React, and TailwindCSS.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 |
| ORM | Sequelize |
| Frontend | React.js + Vite |
| Styling | TailwindCSS |
| Auth | JWT + Role-Based Access Control (RBAC) |
| Charts | Recharts |
| Export | ExcelJS (Excel), PDFKit (PDF) |

## Features

### Authentication & User Management
- JWT-based login/logout with session management
- 4 roles: Admin, Manager, Cashier, Inventory Staff
- Password reset flow
- Per-user activity logs

### Inventory Management
- Product CRUD with SKU, barcode, category, unit, pricing, tax
- Per-branch stock levels
- Stock adjustments (damage, loss, return, correction) with reason logging
- Low-stock alerts and reorder thresholds
- Batch/expiry tracking for perishables
- Barcode generation

### Purchasing & Suppliers
- Supplier database with payment terms
- Purchase orders with draft → pending → approved → received workflow
- Goods Received Notes (GRN) that auto-update stock
- Purchase returns

### Point of Sale (POS)
- Fast checkout with barcode scan or product search
- Cart with item-level and cart-level discounts
- Tax calculation per item
- Multiple payment methods (cash, card, mobile wallet, credit) and split payments
- Hold/resume transactions
- Receipt display with print support
- Sales returns and refunds

### Customer Management
- Customer database with purchase history
- Loyalty points system

### Reporting & Analytics
- Daily/weekly/monthly sales reports
- Profit margin reports (cost vs sale price)
- Stock valuation report
- Best-selling / slow-moving products
- Cashier performance reports
- Excel export

### Multi-Branch Support
- Branch-wise inventory and sales tracking
- Stock transfers between branches

### Audit & Security
- Full audit trail for all stock and price changes
- Helmet.js for HTTP security headers
- Rate limiting
- CORS configuration

## Project Structure

```
InvPos/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── models/          # Sequelize models (20 models)
│   │   ├── migrations/      # SQL migration files (12 migrations)
│   │   ├── controllers/     # Route controllers (11 controllers)
│   │   ├── routes/          # Express route definitions (12 route files)
│   │   ├── middleware/      # Auth, RBAC, error handling, audit logging
│   │   ├── utils/           # Password hashing, JWT, generators, pagination
│   │   ├── app.js           # Express app setup
│   │   ├── server.js        # Server entry point
│   │   ├── migrate.js       # Migration runner
│   │   └── seed.js          # Database seeder
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout component
│   │   ├── context/         # AuthContext
│   │   ├── services/        # API client (axios)
│   │   ├── pages/           # 11 pages (Login, Dashboard, POS, Products, etc.)
│   │   ├── App.jsx          # Router setup
│   │   ├── main.jsx         # App entry
│   │   └── index.css        # TailwindCSS styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── deploy.sh              # One-command deploy & update script
├── .env.example           # Docker compose variables
├── .gitignore
└── README.md
```

## Database Schema

16 core tables across 12 migration files:

1. `roles` + `users` — RBAC and authentication
2. `branches` + `categories` — Multi-branch and product categories
3. `products` + `product_batches` — Products with batch tracking
4. `stock` — Per-branch stock levels
5. `suppliers` + `purchase_orders` + `purchase_order_items` + `goods_received_notes` — Purchasing
6. `sales` + `sale_items` + `payments` — POS transactions
7. `customers` — CRM with loyalty points
8. `stock_adjustments` — Stock changes with reason logging
9. `stock_transfers` + `stock_transfer_items` — Inter-branch transfers
10. `audit_logs` — Full audit trail
11. `sale_returns` + `sale_return_items` — Sales returns/refunds
12. `purchase_returns` + `purchase_return_items` — Purchase returns

## API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List/search products |
| GET | `/api/products/search` | Quick search (barcode/sku/name) |
| GET | `/api/products/low-stock` | Low-stock alerts |
| GET | `/api/products/:id` | Product details |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Deactivate product |
| POST | `/api/products/:id/barcode` | Generate barcode |

### Stock
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock` | Stock levels |
| GET | `/api/stock/:productId` | Stock by product |
| POST | `/api/stock/adjust` | Stock adjustment |
| POST | `/api/stock/transfer` | Transfer between branches |

### Sales / POS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales |
| GET | `/api/sales/:id` | Sale details |
| POST | `/api/sales` | Create sale (checkout) |
| POST | `/api/sales/hold` | Hold transaction |
| POST | `/api/sales/:id/resume` | Resume held transaction |
| POST | `/api/sales/:id/return` | Process return/refund |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List POs |
| POST | `/api/purchase-orders` | Create PO |
| POST | `/api/purchase-orders/:id/submit` | Submit for approval |
| POST | `/api/purchase-orders/:id/approve` | Approve PO |
| POST | `/api/purchase-orders/:id/receive` | Receive goods (GRN) |
| POST | `/api/purchase-orders/:id/cancel` | Cancel PO |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/reports/profit` | Profit margin report |
| GET | `/api/reports/stock-valuation` | Stock valuation |
| GET | `/api/reports/best-selling` | Best-selling products |
| GET | `/api/reports/slow-moving` | Slow-moving products |
| GET | `/api/reports/cashier` | Cashier performance |
| GET | `/api/reports/export` | Export to Excel |

### Example API Requests

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Create Sale:**
```bash
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "productId": 1, "quantity": 2, "unitPrice": 1.50 },
    { "productId": 3, "quantity": 1, "unitPrice": 1.00 }
  ],
  "payments": [
    { "method": "cash", "amount": 5.00 }
  ],
  "discount": 0,
  "discountType": "amount"
}
```

**Create Purchase Order:**
```bash
POST /api/purchase-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplierId": 1,
  "branchId": 1,
  "expectedDate": "2025-01-15",
  "items": [
    { "productId": 1, "quantityOrdered": 100, "unitCost": 0.80, "taxRate": 5 }
  ]
}
```

## Deployment on aaPanel Hosting

This project is designed to run on a VPS with **aaPanel** installed. The backend runs as a PM2-managed Node.js app and the frontend is built and served via Nginx.

### Prerequisites (aaPanel Modules)

Install these modules from the aaPanel App Store:

1. **Nginx** — to serve the frontend and reverse-proxy the API
2. **PostgreSQL** — database (version 14+ recommended)
3. **PM2 Manager** — Node.js process manager (installs Node.js automatically)

### Step 1: Upload Project to Server

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to aaPanel's default site directory
cd /www/wwwroot/

# Clone or upload the project
git clone <repo-url> InvPos
cd InvPos
```

Or upload the project files via aaPanel **File** manager to `/www/wwwroot/InvPos`.

### Step 2: Create PostgreSQL Database

**Via aaPanel UI:**
1. Open **PostgreSQL** module → **Databases** → **Add Database**
2. Database name: `invpos`
3. Username: `invpos`
4. Password: choose a strong password
5. Access: `Local` (or `%` if connecting remotely)

**Via SSH (psql):**
```bash
sudo -u postgres psql
CREATE DATABASE invpos;
CREATE USER invpos WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE invpos TO invpos;
\q
```

### Step 3: Configure Backend

```bash
cd /www/wwwroot/InvPos/backend

# Create .env from template
cp .env.example .env

# Edit .env with your production values
nano .env
```

**`.env` configuration:**
```env
NODE_ENV=production
PORT=5005

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=invpos
DB_USER=invpos
DB_PASS=your_strong_password
DB_DIALECT=postgres

JWT_SECRET=your_long_random_jwt_secret_here
JWT_EXPIRES_IN=24h
JWT_RESET_SECRET=another_long_random_secret

CORS_ORIGIN=http://your-domain.com

# Optional: SMTP for password reset emails
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_email_password
```

### Step 4: Install Dependencies & Run Migrations

```bash
cd /www/wwwroot/InvPos/backend

# Install Node.js dependencies
npm install

# Run database migrations
npm run migrate

# Seed initial data (roles, users, sample products)
npm run seed
```

### Step 5: Start Backend with PM2

```bash
cd /www/wwwroot/InvPos/backend

# Start the backend with PM2
pm2 start src/server.js --name invpos-backend

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup
```

**Or via aaPanel PM2 Manager UI:**
1. Open **PM2 Manager** module
2. Click **Add Project**
3. Project directory: `/www/wwwroot/InvPos/backend`
4. Startup file: `src/server.js`
5. Project name: `invpos-backend`
6. Click **Start**

Verify the backend is running:
```bash
curl http://127.0.0.1:5005/api/health
# Should return: { "status": "ok", ... }
```

### Step 6: Build & Deploy Frontend

```bash
cd /www/wwwroot/InvPos/frontend

# Create .env with your API URL
cp .env.example .env
nano .env
```

**`frontend/.env`:**
```env
VITE_API_URL=http://your-domain.com/api
```

```bash
# Install dependencies
npm install

# Build production bundle
npm run build
```

This generates static files in `frontend/dist/`.

### Step 7: Configure Nginx in aaPanel

1. Open aaPanel → **Website** → **Add Site**
2. Domain: `your-domain.com`
3. Root directory: `/www/wwwroot/InvPos/frontend/dist`
4. PHP version: **Pure static**
5. Click **Create**

Then configure the Nginx config for SPA routing + API reverse proxy:

**aaPanel → Website → your-domain.com → Config:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/InvPos/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # Frontend SPA — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy for API requests
    location /api/ {
        proxy_pass http://127.0.0.1:5005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

Save and reload Nginx:
```bash
nginx -t && nginx -s reload
```

### Step 8: Enable SSL (HTTPS)

1. aaPanel → **Website** → your-domain.com → **SSL**
2. Select **Let's Encrypt**
3. Click **Apply**
4. Enable **Force HTTPS**

### Step 9: Firewall Configuration

Ensure these ports are open in aaPanel → **Security**:

| Port | Service | Access |
|------|---------|--------|
| 80 | HTTP | Public |
| 443 | HTTPS | Public |
| 5005 | Node.js Backend | **Local only** (127.0.0.1) |
| 5432 | PostgreSQL | **Local only** (127.0.0.1) |

> **Important:** Never expose ports 5005 or 5432 to the public. The Nginx reverse proxy handles API access via port 80/443.

### Post-Deployment Verification

```bash
# Check backend status
pm2 status
pm2 logs invpos-backend --lines 20

# Test API health
curl http://127.0.0.1:5005/api/health

# Test login
curl -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test frontend via browser
# Open http://your-domain.com
```

### Updating the Application

```bash
# Pull latest code
cd /www/wwwroot/InvPos
git pull origin main

# Update backend
cd backend
npm install
npm run migrate    # if new migrations exist
pm2 restart invpos-backend

# Update frontend
cd ../frontend
npm install
npm run build

# Nginx serves the new build automatically
```

### PM2 Log Management

```bash
# View logs
pm2 logs invpos-backend

# Limit log size (add to PM2 ecosystem config)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Alternative: Docker Deployment (Git Clone + Easy Updates)

This setup allows you to clone the repo once and update with a single command whenever code changes.

#### First-Time Deploy

```bash
# Install Docker module from aaPanel App Store (if not already installed)

# Clone the repository
cd /www/wwwroot
git clone <repo-url> InvPos
cd InvPos

# Configure environment files
cp .env.example .env              # Docker compose variables
cp backend/.env.example backend/.env  # Backend config

# Edit both .env files with your production values
nano .env
nano backend/.env

# Make the deploy script executable
chmod +x deploy.sh

# Run full deploy (builds containers, runs migrations, seeds DB)
./deploy.sh
```

**Or manually without the script:**
```bash
docker-compose up -d --build
docker exec invpos_backend npm run migrate
docker exec invpos_backend npm run seed
```

#### Updating After Code Changes

Whenever you push changes to git, update the server with one command:

```bash
cd /www/wwwroot/InvPos

# Pull latest code + rebuild containers + run new migrations
./deploy.sh update
```

**Or manually:**
```bash
git pull origin main
docker-compose up -d --build
docker exec invpos_backend npm run migrate
```

The `deploy.sh update` command does all three steps automatically. The backend volume mount (`./backend:/app`) means backend code changes are reflected immediately without rebuild — only frontend changes require the `--build` flag.

#### Deploy Script Commands

```bash
./deploy.sh           # Full deploy (first time or after config changes)
./deploy.sh update     # Git pull + rebuild + restart (for code updates)
./deploy.sh logs       # Show backend logs (live)
./deploy.sh stop       # Stop all services
./deploy.sh restart    # Restart all services
./deploy.sh reset-db   # Delete all data and re-seed (destructive!)
```

#### Docker Compose Configuration

The `docker-compose.yml` reads from `.env` at the project root:

```env
# .env (project root)
NODE_ENV=production
DB_NAME=invpos
DB_USER=invpos
DB_PASSWORD=your_strong_password
VITE_API_URL=http://your-domain.com/api
FRONTEND_PORT=3000
```

The backend also reads from `backend/.env` (via `env_file` in docker-compose). Both files are loaded — `backend/.env` for app-specific secrets (JWT, CORS), and root `.env` for Docker infrastructure settings.

#### Security Notes for Docker Deployment

- Ports `5432` (PostgreSQL) and `5005` (Backend) are bound to `127.0.0.1` only — not exposed publicly
- Use Nginx reverse proxy (see Step 7 in aaPanel section above) to serve the frontend and proxy `/api/` to `127.0.0.1:5005`
- The `FRONTEND_PORT` can be changed in `.env` if port 3000 is in use

#### Auto-Update with Cron (Optional)

Set up automatic updates on a schedule:

```bash
# Edit crontab
crontab -e

# Auto-update every night at 3 AM
0 3 * * * cd /www/wwwroot/InvPos && ./deploy.sh update >> /var/log/invpos-update.log 2>&1
```

### Local Development

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5005/api

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Cashier | cashier | cashier123 |
| Inventory Staff | inventory | inventory123 |

## Role Permissions

| Permission | Admin | Manager | Cashier | Inventory Staff |
|-----------|-------|---------|---------|-----------------|
| POS Terminal | ✅ | ✅ | ✅ | ❌ |
| Product Management | ✅ | ✅ | ❌ | ✅ |
| Stock Management | ✅ | ✅ | ❌ | ✅ |
| Purchase Orders | ✅ | ✅ | ❌ | ✅ |
| PO Approval | ✅ | ✅ | ❌ | ❌ |
| Sales History | ✅ | ✅ | ✅ | ❌ |
| Customer Management | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | Limited | Limited |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |

## Data Backup Strategy

```bash
# Daily backup
pg_dump -U invpos invpos > backup_$(date +%Y%m%d).sql

# Restore
psql -U invpos invpos < backup_YYYYMMDD.sql

# Automated cron backup (add to crontab)
0 2 * * * pg_dump -U invpos invpos > /backups/invpos_$(date +\%Y\%m\%d).sql
```

## Non-Functional Requirements

- **Audit Trail**: All stock and price changes logged in `audit_logs` with old/new values, user, IP, and timestamp
- **Data Backup**: PostgreSQL `pg_dump` strategy (see above)
- **Responsive UI**: TailwindCSS responsive design for tablet/desktop at checkout counter
- **Security**: Helmet.js headers, rate limiting, JWT auth, bcrypt password hashing, RBAC
- **Offline POS**: Architecture supports future IndexedDB-based offline queue with sync-on-reconnect

## License

MIT
