#!/usr/bin/env bash
# Buyer-path bootstrap → optional autonomous agent → harvest FEEDBACK.md
set -uo pipefail
# Intentionally not `set -e`: bootstrap and agent failures still harvest artifacts.

log() {
  printf '[agent-eval][%s] %s\n' "${AGENT_SLUG:-unknown}" "$*" | tee -a /logs/entrypoint.log
}

ensure_dirs() {
  mkdir -p /workspace /logs /artifacts
}

auth_github() {
  if [[ -z "${GH_TOKEN:-}" ]]; then
    log "No GH_TOKEN — create app may fail in published kit mode (expected for local-kit)."
    return 0
  fi
  if ! command -v gh >/dev/null 2>&1; then
    log "gh not installed — skipping GitHub auth"
    return 0
  fi
  printf '%s\n' "$GH_TOKEN" | gh auth login --with-token 2>>/logs/gh-auth.log || {
    log "gh auth login failed (see /logs/gh-auth.log) — continuing"
    return 0
  }
  log "GitHub auth configured"
}

resolve_cli() {
  local kit_mode="${AGENT_EVAL_KIT_MODE:-local-kit}"
  if [[ "$kit_mode" == "local-kit" ]]; then
    if [[ -n "${LOCAL_KIT_ROOT:-}" && -d "${LOCAL_KIT_ROOT}/packages" && -d "${LOCAL_KIT_ROOT}/templates" ]]; then
      export VYBEKIIT_KIT_DIR="$LOCAL_KIT_ROOT"
      log "VYBEKIIT_KIT_DIR=$VYBEKIIT_KIT_DIR"
    fi
    if [[ -f "${LOCAL_CLI_PATH:-}" ]]; then
      VYBEKIIT_BIN=(node "$LOCAL_CLI_PATH")
      log "Using local CLI: $LOCAL_CLI_PATH"
      return 0
    fi
    log "LOCAL_CLI_PATH missing (${LOCAL_CLI_PATH:-unset}) — falling back to npx vybekiit"
  fi
  local pin="${VYBEKIIT_CLI_PIN:-latest}"
  VYBEKIIT_BIN=(npx --yes "vybekiit@${pin}")
  log "Using published CLI: vybekiit@${pin}"
}

# Local-kit: create app resolves monorepo from CLI location when packages/templates exist.
# When CLI lives under /kit-source/cli, resolveKitSource should find monorepo root.
bootstrap_kit() {
  local dest="/workspace/web"
  if [[ -d "$dest" ]] && [[ -n "$(ls -A "$dest" 2>/dev/null || true)" ]]; then
    log "Workspace already has $dest — skipping create app"
    return 0
  fi

  log "Running setup…"
  set +e
  "${VYBEKIIT_BIN[@]}" setup > >(tee -a /logs/setup.stdout.log) 2> >(tee -a /logs/setup.stderr.log >&2)
  local setup_code=$?
  set -e
  log "setup exit=$setup_code"

  log "Creating kit workspace + web surface at $dest…"
  set +e
  # Prefer non-interactive flags. local-kit relies on monorepo-adjacent CLI path.
  if [[ "${AGENT_EVAL_KIT_MODE:-local-kit}" == "local-kit" && -n "${LOCAL_KIT_ROOT:-}" ]]; then
    # Force create-app to use mounted monorepo as kit source by running CLI from monorepo root context.
    # create app resolves kit when packages/templates exist next to cli/ or via gh clone.
    (
      cd /workspace
      # When local CLI is used, kit root is parent of cli/ → /kit-source
      "${VYBEKIIT_BIN[@]}" create app --web "$dest"
    ) > >(tee -a /logs/create-app.stdout.log) 2> >(tee -a /logs/create-app.stderr.log >&2)
  else
    (
      cd /workspace
      "${VYBEKIIT_BIN[@]}" create app --web "$dest"
    ) > >(tee -a /logs/create-app.stdout.log) 2> >(tee -a /logs/create-app.stderr.log >&2)
  fi
  local create_code=$?
  set -e
  log "create app exit=$create_code"

  if [[ "$create_code" -ne 0 ]]; then
    log "create app failed — writing bootstrap failure note"
    cat > /artifacts/BOOTSTRAP_FAILED.md <<EOF
# Bootstrap failed

- agent: ${AGENT_ID:-unknown}
- kit mode: ${AGENT_EVAL_KIT_MODE:-}
- setup exit: ${setup_code}
- create app exit: ${create_code}

See /logs/setup.*.log and /logs/create-app.*.log
EOF
    return "$create_code"
  fi

  # Record bootstrap health for harvest
  {
    echo "created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "agent_id=${AGENT_ID:-}"
    echo "kit_mode=${AGENT_EVAL_KIT_MODE:-}"
    echo "web_dest=$dest"
    if [[ -f "$dest/package.json" ]] || [[ -f "$dest/pnpm-workspace.yaml" ]]; then
      echo "workspace_ok=true"
    else
      echo "workspace_ok=false"
    fi
    if find "$dest" -name 'mcp.json' 2>/dev/null | head -1 | grep -q .; then
      echo "mcp_config=true"
    else
      echo "mcp_config=false"
    fi
  } > /artifacts/bootstrap.env
  log "Bootstrap complete"
  return 0
}

write_mission_file() {
  local mission_path="/artifacts/MISSION.md"
  {
    echo "# Mission — ${AGENT_ID:-agent} — run ${AGENT_EVAL_RUN_ID:-local}"
    echo
    cat /opt/agent-eval/mission/SYSTEM.md
  } > "$mission_path"
  echo "$mission_path"
}

ensure_feedback_stub() {
  local feedback="/artifacts/FEEDBACK.md"
  if [[ -f "$feedback" ]]; then
    return 0
  fi
  # Prefer agent-written copy from workspace if present
  if [[ -f /workspace/web/FEEDBACK.md ]]; then
    cp /workspace/web/FEEDBACK.md "$feedback"
    return 0
  fi
  if [[ -f /workspace/FEEDBACK.md ]]; then
    cp /workspace/FEEDBACK.md "$feedback"
    return 0
  fi
  cat > "$feedback" <<EOF
# Agent feedback — ${AGENT_ID:-unknown} — ${AGENT_EVAL_RUN_ID:-local}

## Product idea
_(agent did not write FEEDBACK.md before exit)_

## Surfaces built (web / extension / mobile) + URLs
_(unknown)_

## What worked (skills, MCP, CLI, docs)
_(unknown)_

## What was broken (exact error + what you tried)
_(unknown — check /logs)_

## What was missing (skill, MCP tool, doctor check, plain-language gap)
_(unknown)_

## Browser automation (used? where? outcome?)
_(unknown)_

## Go-live / payments / auth outcomes
_(unknown)_

## Time spent vs budget
timeout_hours=${AGENT_EVAL_TIMEOUT_HOURS:-6}

## Top 5 product improvements for VybeKiit
1. _
2. _
3. _
4. _
5. _
EOF
  log "Wrote FEEDBACK.md stub (agent did not produce one)"
}

run_agent() {
  local slug="${AGENT_SLUG:-}"
  local runner="/opt/agent-eval/agents/${slug}.sh"
  if [[ ! -x "$runner" ]]; then
    log "No runner for slug=${slug} at $runner"
    return 1
  fi

  local mission
  mission="$(write_mission_file)"
  local hours="${AGENT_EVAL_TIMEOUT_HOURS:-6}"
  # GNU coreutils timeout uses seconds
  local seconds
  seconds="$(awk "BEGIN { printf \"%d\", ${hours} * 3600 }")"

  log "Starting agent ${AGENT_ID:-} for ${hours}h (timeout ${seconds}s)"
  local agent_cwd="/workspace/web"
  if [[ ! -d "$agent_cwd" ]]; then
    agent_cwd="/workspace"
  fi

  set +e
  (
    cd "$agent_cwd"
    export MISSION_FILE="$mission"
    export AGENT_ID AGENT_SLUG AGENT_EVAL_RUN_ID
    if command -v timeout >/dev/null 2>&1; then
      timeout --signal=INT --kill-after=60 "$seconds" "$runner" "$mission"
    else
      "$runner" "$mission"
    fi
  ) > >(tee -a /logs/agent.stdout.log) 2> >(tee -a /logs/agent.stderr.log >&2)
  local code=$?
  set -e
  log "Agent exit=$code"
  echo "agent_exit=$code" >> /artifacts/bootstrap.env
  return 0
}

main() {
  ensure_dirs
  log "start agent_id=${AGENT_ID:-} mode=${AGENT_EVAL_MODE:-full} kit=${AGENT_EVAL_KIT_MODE:-}"
  echo "hello from ${AGENT_ID:-unknown} at $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /artifacts/identity.txt

  auth_github
  resolve_cli
  bootstrap_kit || true

  local mode="${AGENT_EVAL_MODE:-full}"
  if [[ "$mode" == "bootstrap-only" ]]; then
    log "bootstrap-only — skipping agent"
    ensure_feedback_stub
    log "done"
    exit 0
  fi

  run_agent || true
  ensure_feedback_stub
  log "done"
}

main "$@"
