# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Verify the services directory exists in builder stage
RUN ls -la /app/backend/services

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/services

# Copy files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/routes ./routes
COPY --from=builder /app/backend/utils ./utils
COPY --from=builder /app/backend/services/* ./services/
COPY --from=builder /app/backend/server.js ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/.env .env

# Verify the services directory exists and has content
RUN ls -la /app/services

EXPOSE 3001

CMD ["node", "server.js"]

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1 