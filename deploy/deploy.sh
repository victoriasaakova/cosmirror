#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cosmirror/web}"
cd "$APP_DIR"

echo "==> Pulling latest web"
git fetch origin main
git reset --hard origin/main

# Preserve production API URL across deploys
if [[ ! -f .env.production ]]; then
  echo "NEXT_PUBLIC_API_URL=https://api.cosmirror.ru" > .env.production
fi
cp -f .env.production .env.local

echo "==> Installing dependencies"
# Free RAM on small VPS before build
systemctl stop cosmirror-web || true
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Building Next.js"
npm run build

echo "==> Restarting web"
systemctl start cosmirror-web
systemctl is-active cosmirror-web

echo "==> Web deploy done"
