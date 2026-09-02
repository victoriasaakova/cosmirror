#!/usr/bin/env bash
# Deploy cosmirror-web on the production VPS.
# Safe for a ~1GB box: exclusive lock, clean install, restore service on failure.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cosmirror/web}"
SERVICE="${SERVICE:-cosmirror-web}"
LOCK_FILE="${LOCK_FILE:-/var/lock/cosmirror-web-deploy.lock}"
STAMP_FILE="${STAMP_FILE:-$APP_DIR/.deployed-sha}"

cd "$APP_DIR"

# Only one deploy at a time (Actions + manual must not race).
# Wait instead of failing: a second GitHub run used to show a red X
# while the first deploy actually succeeded.
exec 9>"$LOCK_FILE"
if ! flock -w 900 9; then
  echo "ERROR: timed out waiting for another cosmirror-web deploy"
  exit 1
fi

# If we stop the site to free RAM and then fail, bring it back.
ensure_service() {
  systemctl start "$SERVICE" || true
  if systemctl is-active --quiet "$SERVICE"; then
    echo "==> $SERVICE is active"
  else
    echo "==> WARNING: $SERVICE is not active"
  fi
}
trap ensure_service EXIT

echo "==> Pulling latest web"
git fetch origin main
WANT="$(git rev-parse origin/main)"

if [[ -f "$STAMP_FILE" && "$(tr -d '[:space:]' < "$STAMP_FILE")" == "$WANT" ]] \
  && systemctl is-active --quiet "$SERVICE" \
  && [[ -s .next/BUILD_ID ]]; then
  echo "==> Already deployed $WANT — skip rebuild"
  trap - EXIT
  echo "==> Web deploy done"
  exit 0
fi

git reset --hard origin/main

# Preserve production API URL across deploys
if [[ ! -f .env.production ]]; then
  echo "NEXT_PUBLIC_API_URL=https://api.cosmirror.ru" > .env.production
fi
ensure_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env.production; then
    return
  fi
  printf '%s=%s\n' "$key" "$value" >> .env.production
}
ensure_env NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN "phc_APmaNrkAD26rcLdUKopGwiWNe3ufT4KVzoMDi7Ye2ikm"
ensure_env NEXT_PUBLIC_POSTHOG_HOST "https://us.i.posthog.com"
SHARE_KEY_FILE="${SHARE_KEY_FILE:-/opt/cosmirror/share-internal.key}"
mkdir -p "$(dirname "$SHARE_KEY_FILE")"
if [[ ! -f "$SHARE_KEY_FILE" ]]; then
  tmp="$(mktemp "${SHARE_KEY_FILE}.XXXXXX")"
  python3 -c 'import secrets; print(secrets.token_urlsafe(48))' > "$tmp"
  chmod 600 "$tmp"
  ln "$tmp" "$SHARE_KEY_FILE" 2>/dev/null || true
  rm -f "$tmp"
fi
for _ in 1 2 3 4 5 6 7 8 9 10; do
  [[ -s "$SHARE_KEY_FILE" ]] && break
  sleep 0.5
done
SHARE_INTERNAL_KEY="$(tr -d '[:space:]' < "$SHARE_KEY_FILE")"
if [[ -z "$SHARE_INTERNAL_KEY" ]]; then
  echo "ERROR: missing $SHARE_KEY_FILE"
  exit 1
fi
ensure_env SHARE_INTERNAL_KEY "$SHARE_INTERNAL_KEY"
cp -f .env.production .env.local

echo "==> Stopping $SERVICE to free RAM for build"
systemctl stop "$SERVICE" || true
# Leave headroom for npm + Next on a 1GB VPS (768 often OOMs).
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

echo "==> Installing dependencies"
# Partial/corrupt node_modules from OOM kills cause ENOTEMPTY / TAR_ENTRY_ERROR.
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
trap - EXIT
systemctl start "$SERVICE"
systemctl is-active "$SERVICE"
printf '%s\n' "$WANT" > "$STAMP_FILE"

echo "==> Web deploy done"
