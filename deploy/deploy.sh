#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cosmirror/web}"
cd "$APP_DIR"

echo "==> Pulling latest web"
git fetch origin main
git reset --hard origin/main

echo "==> Installing dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Building Next.js"
npm run build

echo "==> Restarting web"
systemctl restart cosmirror-web
systemctl is-active cosmirror-web

echo "==> Web deploy done"
