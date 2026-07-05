#!/usr/bin/env bash
# PRIORITY: 6 — Data fetching must have loading/error states
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 6
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(tsx|jsx)$' || exit 0

# Check for data fetching
echo "$HOOK_CONTENT" | grep -qE 'useQuery|useSWR|useFetch|useLoaderData' || exit 0

# Must have loading/error handling
HAS_LOADING=$(echo "$HOOK_CONTENT" | grep -cE 'isLoading|isPending|Skeleton|Spinner|Loading' || true)
HAS_ERROR=$(echo "$HOOK_CONTENT" | grep -cE 'isError|error|ErrorBoundary' || true)

if [[ "$HAS_LOADING" -eq 0 || "$HAS_ERROR" -eq 0 ]]; then
  vybekiit_block "Data fetching without loading/error states. Add loading indicator + error boundary."
fi

exit 0
