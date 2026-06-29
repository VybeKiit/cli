#!/usr/bin/env bash
# Enable branch protection on VybeKiit repos (requires GitHub Team/Pro on private repos).
# Usage: ./scripts/setup-branch-protection.sh

set -euo pipefail

ORG="VybeKiit"
REPOS=(vybekiit web mobile extension cli)

for repo in "${REPOS[@]}"; do
  echo "Setting branch protection on ${ORG}/${repo}..."
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${ORG}/${repo}/branches/main/protection" \
    -f required_status_checks[strict]=true \
    -f required_status_checks[contexts][]=verify \
    -f enforce_admins=false \
    -f required_pull_request_reviews[required_approving_review_count]=0 \
    -f restrictions=null \
    || echo "  ⚠ Failed (may need GitHub Team/Pro) — rely on AGENTS.md merge policy"
done

echo "Done. If API calls failed, enforce PR-only merges manually via agent discipline."
