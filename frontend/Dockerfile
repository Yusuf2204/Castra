# ============================================================
# React CMS Frontend — Multi-stage (Node 22 → Nginx Alpine)
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# install dependencies (cache-friendly layer)
COPY package.json package-lock.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────
FROM nginx:alpine

# custom nginx configuration for static SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
