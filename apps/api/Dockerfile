# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json         ./apps/api/

# Install all deps (dev included — needed to compile TypeScript)
RUN npm install --ignore-scripts

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/        ./apps/api/

# Build shared package first (API imports from it)
RUN npm --workspace packages/shared run build

# Build API (tsc → apps/api/dist/)
RUN npm --workspace apps/api run build

# ─── Stage 2: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json         ./apps/api/

# Install production deps only (workspace symlinks are created automatically)
RUN npm install --omit=dev --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist        ./apps/api/dist

EXPOSE 4000

# Runs public schema migrations then starts the server.
# Kysely migrations are idempotent (ifNotExists) so this is safe on restarts.
CMD ["sh", "-c", "node apps/api/dist/src/db/migrate.mjs public && node apps/api/dist/src/index.js"]
