# Stage 1 — builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2 — runtime
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S node -G appgroup

# Copy dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=node:appgroup . .

# Create uploads directory
RUN mkdir -p uploads/receipts && chown -R node:appgroup uploads

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["sh", "-c", "node src/scripts/migrate.js && node src/server.js"]
