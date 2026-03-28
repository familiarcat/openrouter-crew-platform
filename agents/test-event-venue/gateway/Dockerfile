FROM node:20-alpine AS builder
WORKDIR /app

COPY agents/gateway/package*.json agents/gateway/tsconfig.json ./
RUN npm install

COPY agents/gateway/src/ ./src/
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
