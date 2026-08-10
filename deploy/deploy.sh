#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cosmirror/web}"
SERVICE="${SERVICE:-cosmirror-web}"
cd "$APP_DIR"

# Always try to bring the site back up if deploy fails mid-way
# (we stop the unit to free RAM on a small VPS before build).
ensure_service() {
  systemctl start "$SERVICE" || true
  systemctl is-active --quiet "$SERVICE" && echo "==> $SERVICE is active" || echo "==> WARNING: $SERVICE is not active"
}
trap ensure_service EXIT

echo "==> Pulling latest web"
git fetch origin main
git reset --hard origin/main

# Preserve production API URL across deploys
if [[ ! -f .env.production ]]; then
  echo "NEXT_PUBLIC_API_URL=https://api.cosmirror.ru" > .env.production
fi
cp -f .env.production .env.local

echo "==> Stopping $SERVICE to free RAM for build"
systemctl stop "$SERVICE" || true
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

echo "==> Installing dependencies"
# Corrupt/partial node_modules left from OOM installs cause:
#   TAR_ENTRY_ERROR ENOENT … then `next: not found`
rm -rf node_modules
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

if [[ ! -x node_modules/.bin/next ]]; then
  echo "ERROR: next binary missing after install; retrying once"
  rm -rf node_modules
  npm cache clean --force || true
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

if [[ ! -x node_modules/.bin/next ]]; then
  echo "ERROR: next binary still missing after retry"
  exit 1
fi

echo "==> Building Next.js"
npm run build

echo "==> Starting $SERVICE"
# Disable EXIT trap before explicit start so we don't double-start noisily
trap - EXIT
systemctl start "$SERVICE"
systemctl is-active "$SERVICE"

echo "==> Web deploy done"
