# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install


COPY . .

RUN npx prisma generate

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/routes ./routes
COPY --from=builder /app/backend/utils ./utils
COPY --from=builder /app/backend/server.js ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/.env .env

EXPOSE 3001

CMD ["node", "server.js"] 