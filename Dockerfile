# Multi-stage production build for BrightLoop API Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# Copy server source and prisma schema
COPY server/ ./

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for Prisma runtime engine
RUN apk add --no-cache openssl

# Copy artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
