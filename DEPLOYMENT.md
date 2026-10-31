# 🚀 BrightLoop Deployment Guide

This guide covers production deployment configurations for the BrightLoop Subscription & Recurring Billing Platform.

---

## Architecture Overview

- **Frontend Client (`/client`)**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Backend API (`/server`)**: Node.js + Express + TypeScript + Prisma ORM + JWT/Cookie Auth.
- **Database**: PostgreSQL (Neon Serverless with Connection Pooling).

---

## Deployment Option 1: Split Cloud Deployment (Recommended)

### 1. Database (Neon PostgreSQL)
1. In your [Neon Console](https://console.neon.tech), grab your pooled database connection string (`DATABASE_URL`) and direct connection string (`DIRECT_URL`).
2. Ensure `sslmode=require` is present in the connection string.

---

### 2. Backend Deployment (Render / Railway / Fly.io)

#### Step 1: Create a Web Service
- **Root Directory**: `server` (or repository root using `npm run start --prefix server`)
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
  *(Note: `npm run build` in `/server` automatically runs `prisma generate && tsc`)*
- **Start Command**:
  ```bash
  npm start
  ```
  *(Executes `node dist/server.js`)*

#### Step 2: Set Server Environment Variables
| Variable | Value / Description | Example |
|---|---|---|
| `NODE_ENV` | `production` | `production` |
| `PORT` | Cloud-assigned port | `5000` (Render/Railway set automatically) |
| `DATABASE_URL` | Neon pooled connection string | `postgresql://user:pass@ep-xyz-pooler.region.neon.tech/brightloop?sslmode=require` |
| `DIRECT_URL` | Neon direct connection string (optional) | `postgresql://user:pass@ep-xyz.region.neon.tech/brightloop?sslmode=require` |
| `JWT_SECRET` | 32+ character random secret | `openssl rand -base64 32` |
| `COOKIE_SECRET` | 32+ character random secret | `openssl rand -base64 32` |
| `COOKIE_SAME_SITE` | `none` (for cross-domain deployments) | `none` |
| `CORS_ORIGIN` | Your deployed frontend URL(s) | `https://brightloop.vercel.app` |

---

### 3. Frontend Deployment (Vercel / Netlify / Cloudflare)

#### Step 1: Create Project on Vercel
- **Root Directory**: `client`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Step 2: Set Client Environment Variables
| Variable | Value / Description | Example |
|---|---|---|
| `VITE_API_URL` | Your deployed backend URL (no trailing slash) | `https://brightloop-api.onrender.com` |

*(Note: SPA routing is pre-configured via `client/vercel.json` and `client/public/_redirects` to route all dynamic paths to `index.html` without 404s).*

---

## Deployment Option 2: Docker / Container Deployment

A multi-stage production Dockerfile is included at the repository root.

### Build and Run Docker Container:
```bash
# Build the production image
docker build -t brightloop-api .

# Run container with environment variables
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-neon-database-url" \
  -e JWT_SECRET="your-secure-jwt-secret" \
  -e COOKIE_SECRET="your-secure-cookie-secret" \
  -e CORS_ORIGIN="https://your-frontend-domain.com" \
  brightloop-api
```

---

## Deployment Option 3: Monorepo Single-Server Orchestration

If deploying to a single virtual server (DigitalOcean Droplet, AWS EC2, or Linux VM):

```bash
# 1. Install dependencies across both workspaces
npm run install:all

# 2. Build both server and client
npm run build

# 3. Run database migrations
cd server && npx prisma migrate deploy && cd ..

# 4. Start production backend server
npm start
```

---

## Health Check & Verification

Once deployed, verify your backend health check:
```bash
curl -I https://your-backend-api-url/api/v1/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "service": "brightloop-server",
  "environment": "production"
}
```

---

## Post-Deployment Checklist

- [x] Prisma Client automatically generates during `build` and `postinstall`.
- [x] Client supports dual authentication: HttpOnly Cookie and `Authorization: Bearer <token>` fallback.
- [x] Trust proxy (`app.set("trust proxy", 1)`) enabled for cloud reverse proxies.
- [x] SPA client routing (`client/vercel.json` and `client/public/_redirects`) prevents 404 errors on deep linking.
- [x] Database connection pooling safe for serverless Neon PostgreSQL.
- [x] Graceful shutdown handles `SIGTERM` and `SIGINT` cleanly.
