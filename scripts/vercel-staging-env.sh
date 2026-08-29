#!/usr/bin/env bash
# Push staging + production NEXT_PUBLIC_* vars to Vercel for nq-admin-frontend.
#
# Prerequisites: vercel login, ./scripts/vercel-link.sh
# Staging API: https://api-netqwix.online (EC2 staging)
# Staging admin URL: https://staging-admin.netqwix.com (add domain in Vercel → staging branch)
#
# On staging EC2 .env:
#   ADMIN_FRONTEND_URL=https://staging-admin.netqwix.com
#   FRONTEND_URL=https://staging-netqwix.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-netqwixs-projects-459a7f1f}"

STAGING_API="${STAGING_API:-https://api-netqwix.online}"
STAGING_WEB="${STAGING_WEB:-https://staging-netqwix.com}"
STAGING_ADMIN="${STAGING_ADMIN:-https://staging-admin.netqwix.com}"
PROD_API="${PROD_API:-https://api-netqwix.com}"
PROD_WEB="${PROD_WEB:-https://www.netqwix.com}"
PROD_ADMIN="${PROD_ADMIN:-https://admin.netqwix.com}"
S3_BASE="${S3_BASE:-https://data.netqwix.com}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

if [ ! -f .vercel/project.json ]; then
  echo "Run ./scripts/vercel-link.sh first"
  exit 1
fi

vercel whoami --scope "$SCOPE" >/dev/null 2>&1 || {
  echo "Not logged in. Run: vercel login"
  exit 1
}

set_var() {
  local key="$1" value="$2" env="$3" branch="${4:-}"
  echo "  → $key ($env${branch:+ branch=$branch})"
  if [ -n "$branch" ]; then
    vercel env rm "$key" "$env" "$branch" --scope "$SCOPE" --yes 2>/dev/null || true
    printf '%s' "$value" | vercel env add "$key" "$env" "$branch" --scope "$SCOPE" --yes
  else
    vercel env rm "$key" "$env" --scope "$SCOPE" --yes 2>/dev/null || true
    printf '%s' "$value" | vercel env add "$key" "$env" --scope "$SCOPE" --yes
  fi
}

echo "== Preview (all branches) — staging EC2 API =="
set_var NEXT_PUBLIC_API_BASE_URL "$STAGING_API" preview
set_var NEXT_PUBLIC_S3_BASE_URL "$S3_BASE" preview
set_var NEXT_PUBLIC_ADMIN_REGISTER_ENABLED "false" preview

if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  set_var NEXT_PUBLIC_GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID" preview
fi

echo "== Preview (staging branch) — web preview + admin canonical URL =="
set_var NEXT_PUBLIC_WEB_APP_URL "$STAGING_WEB" preview staging

echo "== Production (main) =="
set_var NEXT_PUBLIC_API_BASE_URL "$PROD_API" production
set_var NEXT_PUBLIC_WEB_APP_URL "$PROD_WEB" production
set_var NEXT_PUBLIC_S3_BASE_URL "$S3_BASE" production
set_var NEXT_PUBLIC_ADMIN_REGISTER_ENABLED "false" production

if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  set_var NEXT_PUBLIC_GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID" production
fi

echo ""
echo "Done. Push to staging branch or run: vercel deploy --scope $SCOPE"
echo "Add domain staging-admin.netqwix.com → Git branch staging in Vercel Domains."
echo "Google OAuth: authorized JavaScript origins must include $STAGING_ADMIN"
