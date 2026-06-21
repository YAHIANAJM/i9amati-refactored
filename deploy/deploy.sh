#!/bin/bash
# Re-deploy script — run on the VPS for every code update.
# Usage: bash deploy/deploy.sh
set -e

APP_DIR="/var/www/i9amati"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"

echo "==> [1/5] Pulling latest code"
cd $APP_DIR
git pull origin main

echo "==> [2/5] Starting PostgreSQL container"
docker compose -f $COMPOSE_FILE up -d postgres

echo "==> [3/5] Building app images"
docker compose -f $COMPOSE_FILE build api

echo "==> [4/5] Running public schema migrations"
docker compose -f $COMPOSE_FILE run --rm api npm run db:migrate:public:prod

echo "==> [5/5] Starting application stack"
docker compose -f $COMPOSE_FILE up -d --remove-orphans api

echo ""
docker compose -f $COMPOSE_FILE ps
echo "✓ Deploy complete."
