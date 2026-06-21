#!/bin/bash
# Initial one-time VPS setup — run as root on a fresh Ubuntu 24.04 Hostinger VPS.
# Usage: bash deploy/setup.sh
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

: "${API_DOMAIN:?Set API_DOMAIN before running, for example: API_DOMAIN=srv1765015.hstgr.cloud}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL before running, for example: CERTBOT_EMAIL=you@example.com}"

echo "==> Installing system dependencies"
apt-get update -y
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed on this VPS"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose plugin is not available"; exit 1; }

if ss -ltnp | grep -q ':80 '; then
	echo "Port 80 is already in use. Stop the conflicting service before continuing."
	exit 1
fi

systemctl enable --now nginx

echo "==> Configuring UFW firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Copying nginx config"
cp "$REPO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/i9amati
sed -i "s/srv1765015.hstgr.cloud/$API_DOMAIN/g" /etc/nginx/sites-available/i9amati
ln -sf /etc/nginx/sites-available/i9amati /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Obtaining SSL certificates"
certbot --nginx -d $API_DOMAIN --non-interactive --agree-tos -m $CERTBOT_EMAIL

echo ""
echo "=========================================="
echo "Setup complete! Next steps:"
echo "  1. Copy apps/api/.env.production.example to apps/api/.env.production and fill in values"
echo "  2. Set POSTGRES_PASSWORD / BETTER_AUTH_SECRET / GROQ_API_KEY"
echo "  3. Run: bash deploy/deploy.sh"
echo "=========================================="
