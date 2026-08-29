#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== NetQwix admin (nq-admin-frontend) ==="
echo "GitHub:     itnetqwix/nq-admin-frontend"
echo "Vercel:     nq-admin-frontend (prj_VVAsyuUfmVT7yAeMsIRPf05LordC)"
echo ""
echo "| Git branch | Vercel target | Public URL              | API (build)              |"
echo "|------------|---------------|-------------------------|--------------------------|"
echo "| main       | Production    | admin.netqwix.com       | api-netqwix.com          |"
echo "| staging    | Preview       | admin-staging.netqwix.com | api-netqwix.online     |"
echo "| feature/*  | Preview       | *-git-*-.vercel.app     | api-netqwix.online       |"
echo "| local dev  | —             | localhost:3001          | api-netqwix.online (.env.development) |"
echo ""
echo "GitHub secrets (deploy-staging.yml): VERCEL_TOKEN, VERCEL_ORG_ID=team_Q4kWzTGDjxFkSWH1h6cywTSg, VERCEL_PROJECT_ID=prj_VVAsyuUfmVT7yAeMsIRPf05LordC"
echo ""

node scripts/vercelEnv.selfcheck.js
echo "verify-deploy-matrix: OK"
