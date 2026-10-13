#!/usr/bin/env bash
# Push Sentry DSN + build auth token to Vercel (nq-admin-frontend / project admin-portal).
#
# Export before running:
#   export NEXT_PUBLIC_SENTRY_DSN='https://…'   # admin-portal public DSN
#   export SENTRY_AUTH_TOKEN='sntryu_…'
#   export NEXT_PUBLIC_SENTRY_ORG=netqwix
#   export NEXT_PUBLIC_SENTRY_PROJECT=          # optional numeric project id
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-netqwixs-projects-459a7f1f}"

if [[ -z "${NEXT_PUBLIC_SENTRY_DSN:-}" ]]; then
  echo "Missing NEXT_PUBLIC_SENTRY_DSN — abort"
  exit 1
fi

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

ORG="${NEXT_PUBLIC_SENTRY_ORG:-netqwix}"
PROJECT="${NEXT_PUBLIC_SENTRY_PROJECT:-4512180160888832}"

echo "== Preview =="
set_var NEXT_PUBLIC_SENTRY_DSN "$NEXT_PUBLIC_SENTRY_DSN" preview
set_var NEXT_PUBLIC_SENTRY_ORG "$ORG" preview
set_var NEXT_PUBLIC_SENTRY_PROJECT "$PROJECT" preview
if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  set_var SENTRY_AUTH_TOKEN "$SENTRY_AUTH_TOKEN" preview
fi

echo "== Production =="
set_var NEXT_PUBLIC_SENTRY_DSN "$NEXT_PUBLIC_SENTRY_DSN" production
set_var NEXT_PUBLIC_SENTRY_ORG "$ORG" production
set_var NEXT_PUBLIC_SENTRY_PROJECT "$PROJECT" production
if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  set_var SENTRY_AUTH_TOKEN "$SENTRY_AUTH_TOKEN" production
fi

echo ""
echo "Done. Redeploy admin Preview/Production."
