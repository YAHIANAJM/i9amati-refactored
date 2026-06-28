# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_URL is a BUILD-TIME variable — it gets baked into the JS bundle.
# Leave it empty so all /api/* calls are relative to the same origin.
# nginx.conf (Stage 2) then proxies /api/ → api:4000 inside the Docker network.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json         ./apps/web/

# Install all deps (dev included — needed to compile TypeScript + Vite build)
RUN npm ci --ignore-scripts

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/web/        ./apps/web/

# Build shared package first (web imports from it)
RUN npm --workspace packages/shared run build

# Build web (tsc + vite build → apps/web/dist/)
RUN npm --workspace apps/web run build

# ─── Stage 2: Serve with nginx ───────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy the built SPA
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Use the existing nginx config — serves SPA + proxies /api/ → api:4000
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
