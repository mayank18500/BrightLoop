# 🔄 BrightLoop — Enterprise Subscription Management & Recurring Billing Platform

BrightLoop is an enterprise-grade, multi-tenant subscription lifecycle management and automated recurring billing platform. It eliminates spreadsheet-driven operations by providing automated commercial quotation workflows, deterministic subscription lifecycle state machines, recurring invoicing runners, flexible multi-invoice (M:N) payment allocation, dynamic tax/discount calculation engines, and real-time executive financial analytics.

Built for the **ODOO Hackathon**, BrightLoop is engineered as a clean modular monolith adhering to rigorous financial standards (PostgreSQL `Decimal(12, 2)` monetary precision, zero floating-point arithmetic drift, and strict IDOR tenant isolation).

---

## 🌟 Key Highlights & Capabilities

### 1. Multi-Tenant Role-Based Portals
- **Executive Admin Console (`/admin`)**: Live MRR / ARR tracking, churn analysis, overdue invoice aging buckets (1–30, 31–60, 61–90, 90+ days), product catalog management, plan policy configuration, tax & discount rules, and staff account provisioning.
- **Operations Staff Center (`/staff`)**: Full quotation drafting, conversion pipelines, subscription contract monitoring, recurring invoice generation, and manual payment allocations.
- **Customer Self-Service Portal (`/portal`)**: Secure client space to review commercial proposals, accept quotation contracts, view active subscriptions, download invoices, and inspect payment receipts.

### 2. Commercial Quotation & Conversion Pipeline
- **Sequential Sequence Generation**: `QT-YYYYMM-XXXX` identifier sequence.
- **Price Snapshotting**: Freezes negotiated line item unit prices, variant adjustments, and tax rates at time of quote creation, insulating customers from subsequent catalog price updates.
- **Online Proposal Review**: Interactive modal for clients to inspect line breakdowns and accept quotations online.
- **Atomic 1-Click Conversion**: Automatically transitions accepted quotations into active subscriptions with line-item fidelity.

### 3. Subscription Lifecycle State Machine
- **Deterministic State Transitions**:
  $$\text{DRAFT} \longrightarrow \text{QUOTATION} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \underset{\text{Resume}}{\overset{\text{Pause}}{\rightleftharpoons}} \text{PAUSED} \longrightarrow \text{CLOSED}$$
- **Fair Billing Recalibration**: Automatically recalculates and advances `nextBillingDate` when unpausing subscriptions to ensure customers are not billed for paused downtime.
- **Plan Lifecycle Policy Enforcement**: Configurable flags per plan (`allowPause`, `allowEarlyClosure`, `allowRenewal`, `autoCloseOnExpiry`, `minQuantity`).

### 4. Recurring Billing & Invoicing Engine
- **Automated Period Runner**: Evaluates all due active subscriptions, generating consolidated invoices with exact line items, prorations, taxes, and coupon discounts.
- **Double-Billing Prevention**: Enforced via PostgreSQL composite unique index on `(subscriptionId, billingPeriodStart, billingPeriodEnd)`.
- **Full Invoice Lifecycle**: `DRAFT` $\to$ `CONFIRMED` $\to$ `PAID` / `CANCELLED`.
- **Printable Invoices**: Clean, printable invoice layout with tax breakdowns and payment receipts.

### 5. Manual Payment Engine & M:N Multi-Invoice Allocation
- **Multi-Invoice Settlement**: Single incoming lump-sum payments (UPI, Bank Transfer, Cash, Cheque, NEFT/RTGS) can be allocated across multiple outstanding invoices.
- **Unallocated Payment Float**: Excess payment amounts remain tracked as `Payment.unallocatedAmount` and can be allocated to future invoices via secondary allocation workflows.
- **Automatic Status Settlement**: Invoices automatically transition from `CONFIRMED` to `PAID` as soon as `amountPaid >= totalAmount`.
- **Audit Trails**: Complete transparency on who recorded the payment, allocation dates, and reference numbers.

### 6. Financial Analytics & Executive Reporting
- **Real-Time MRR & ARR**: Dynamically normalized across `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` plan intervals.
- **Aged Receivables Analysis**: Real-time bucketed overdue receivables (Current, 1–30 Days, 31–60 Days, 61–90 Days, 90+ Days).
- **Revenue Realization**: Total collected cash vs uncollected receivables and active subscriber retention rates.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React, Axios, React Router 7 |
| **Backend** | Node.js 20, Express 4, TypeScript 5.7, Zod Validation, RESTful API |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM 6.19.3 |
| **Authentication** | JWT stored in secure HTTP-only cookies (`brightloop_token`), bcrypt (12 salt rounds) |
| **Financial Accuracy** | PostgreSQL `Decimal(12, 2)` / `Prisma.Decimal` (No JavaScript IEEE 754 floating-point calculations) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (v10+)
- **PostgreSQL / Neon Database Connection URL**

### 1. Backend Setup

```bash
cd server
npm install

# Configure environment variables (.env)
cp .env.example .env # Ensure DATABASE_URL, JWT_SECRET, PORT are set

# Generate Prisma Client & Run Migrations
npm run prisma:generate
npm run prisma:migrate

# Seed Database with Default Catalog, Plans, and Test Users
npm run db:seed

# Start the Backend Server
npm run dev # Runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd client
npm install

# Start the Vite Development Server
npm run dev # Runs on http://localhost:5173
```

---

## 👥 Demo Credentials

The database seeder pre-populates three distinct user personas for instant testing:

| Role | Email | Password | Access / Portal |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@brightloop.com` | `Admin@123` | Full system access, Executive Analytics, Product Catalog, Staff Provisioning (`/admin`) |
| **Staff Member** | `staff@brightloop.com` | `Staff@123` | Operational Access: Customers, Quotations, Subscriptions, Invoicing, Payments (`/staff`) |
| **Customer** | `customer@acmecorp.com` | `Customer@123` | Self-Service Portal: Proposals, Subscriptions, Invoices, Payment History (`/portal`) |

> *Tip: The login page includes a 1-click **Quick Demo Switcher** to switch between Admin, Staff, and Customer credentials instantly without typing.*

---

## 🧪 Comprehensive Integration Test Suite

BrightLoop includes 7 dedicated end-to-end integration test suites verifying all critical business workflows against the live database:

```bash
cd server

# Run individual test suites
npm run test:auth          # Phase 3: Authentication, RBAC, Customer IDOR guards (8/8 tests)
npm run test:catalog       # Phase 4: Products, Variants, Plans, Taxes & Coupons (5/5 tests)
npm run test:quotations    # Phase 5: Quotation sequences, Price snapshots, Conversions (6/6 tests)
npm run test:subscriptions # Phase 6: Subscription state machine, Fair pause recalibration (8/8 tests)
npm run test:invoices      # Phase 7: Recurring billing runner, Idempotency & Invoicing (6/6 tests)
npm run test:payments      # Phase 8: M:N Multi-invoice allocation, float tracking (5/5 tests)
npm run test:reports       # Phase 9: Real-time MRR/ARR, aging buckets, executive analytics (3/3 tests)

# Run the complete test suite in sequence
npm run test:all
```

---

## 🔒 Security & Data Integrity Guarantees

1. **Strict IDOR Isolation**: Customer endpoints enforce `requireCustomerOwnership` middleware ensuring client accounts can only inspect their own quotations, subscriptions, invoices, and payment receipts.
2. **HttpOnly Cookie Authentication**: Session tokens are isolated from client-side JavaScript execution via `HttpOnly`, `SameSite=Lax`, and `Secure` cookie flags.
3. **Double-Billing Idempotency**: Recurring billing cycles enforce a composite database constraint on `(subscriptionId, billingPeriodStart, billingPeriodEnd)`.
4. **Immutable Price Snapshots**: Catalog adjustments do not retroactively alter contractual pricing on active subscriptions or historical invoices.
5. **Decimal Financial Accuracy**: All invoice subtotals, taxes, discounts, totals, and payment balances use exact 2-decimal arithmetic.

---

## 📄 License
This project was developed for the **ODOO Hackathon 2026**.
