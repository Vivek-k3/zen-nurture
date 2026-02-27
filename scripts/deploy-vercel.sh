#!/usr/bin/env bash
# Add CONVEX_DEPLOY_KEY to Vercel and deploy.
# Usage: ./scripts/deploy-vercel.sh [deploy-key]
# Or: CONVEX_DEPLOY_KEY=xxx ./scripts/deploy-vercel.sh

set -e

KEY="${1:-$CONVEX_DEPLOY_KEY}"

if [[ -z "$KEY" ]]; then
  echo "Get your Production Deploy Key from: https://dashboard.convex.dev → Settings → Deploy Keys"
  echo ""
  echo "Usage: CONVEX_DEPLOY_KEY=your-key ./scripts/deploy-vercel.sh"
  echo "   Or: ./scripts/deploy-vercel.sh your-key"
  exit 1
fi

echo "Adding CONVEX_DEPLOY_KEY to Vercel (Production)..."
echo "$KEY" | vercel env add CONVEX_DEPLOY_KEY production --yes --sensitive --force

echo "Deploying to production..."
vercel deploy --prod
