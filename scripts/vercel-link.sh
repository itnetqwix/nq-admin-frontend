#!/usr/bin/env bash
# Link nq-admin to the existing Vercel project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ORG_ID="${VERCEL_ORG_ID:-team_Q4kWzTGDjxFkSWH1h6cywTSg}"
PROJECT_ID="${VERCEL_PROJECT_ID:-prj_VVAsyuUfmVT7yAeMsIRPf05LordC}"
SCOPE="${VERCEL_SCOPE:-netqwixs-projects-459a7f1f}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

vercel link --yes --scope "$SCOPE" --project nq-admin-frontend

mkdir -p .vercel
cat > .vercel/project.json <<EOF
{"orgId":"${ORG_ID}","projectId":"${PROJECT_ID}","projectName":"nq-admin-frontend"}
EOF

echo "Linked nq-admin-frontend (${PROJECT_ID})"
echo "Next: ./scripts/vercel-staging-env.sh"
