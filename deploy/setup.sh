#!/bin/bash
# Initial one-time VPS setup — run as root on a fresh Ubuntu 24.04 Hostinger VPS.
# Usage: bash deploy/setup.sh
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Installing system dependencies"
apt-get update -y
apt-get install -y ca-certificates curl git ufw

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed on this VPS"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose plugin is not available"; exit 1; }

echo "==> Configuring UFW firewall"
ufw allow OpenSSH
ufw allow 4000/tcp
ufw --force enable

echo ""
echo "=========================================="
echo "Setup complete! Next steps:"
echo "  1. Copy apps/api/.env.production.example to apps/api/.env.production and fill in values"
echo "  2. Set POSTGRES_PASSWORD / BETTER_AUTH_SECRET / GROQ_API_KEY"
echo "  3. Run: bash deploy/deploy.sh"
echo "=========================================="
