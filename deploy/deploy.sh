#!/bin/bash
# Re-deploy script — run on the VPS for every code update.
# Usage: bash deploy/deploy.sh
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
COMPOSE_ENV_FILE="$APP_DIR/apps/api/.env.production"

echo "==> [1/5] Pulling latest code"
cd $APP_DIR
git pull origin master

echo "==> [2/5] Starting PostgreSQL container"
docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE up -d postgres

echo "==> [3/5] Building app images"
docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE build api web

echo "==> [4/5] Running public schema migrations"
docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE run --rm api npm run db:migrate:public:prod

echo "==> [5/5] Starting application stack"
docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE up -d --remove-orphans api web

echo ""
docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE ps
echo "✓ Deploy complete."
