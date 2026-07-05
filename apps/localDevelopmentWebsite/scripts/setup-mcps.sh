#!/usr/bin/env bash
# setup-mcps.sh — Register MCP servers with ALL available coding agents
# Supports: Kiro, Claude Code, Cursor, Codex
#
# Usage:
#   ./scripts/setup-mcps.sh --list           # Show available MCPs
#   ./scripts/setup-mcps.sh --all            # Register all MCPs with all agents
#   ./scripts/setup-mcps.sh --recommended    # Register core + project-detected
#   ./scripts/setup-mcps.sh stripe supabase  # Register specific MCPs
#   ./scripts/setup-mcps.sh --agent kiro stripe github  # Only register for Kiro
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CATALOG="$SCRIPT_DIR/mcp-servers.json"

if [ ! -f "$CATALOG" ]; then
  echo "❌ MCP catalog not found: $CATALOG"
  exit 1
fi

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# Detect available agents
HAS_KIRO=false; HAS_CLAUDE=false; HAS_CURSOR=false; HAS_CODEX=false
command -v kiro-cli &>/dev/null && HAS_KIRO=true
command -v claude &>/dev/null && HAS_CLAUDE=true
[ -d "$PROJECT_ROOT/.cursor" ] || [ -d "$HOME/.cursor" ] && HAS_CURSOR=true
command -v codex &>/dev/null && HAS_CODEX=true

# Target agent filter (empty = all detected)
TARGET_AGENT=""

show_agents() {
  echo -e "${BLUE}Detected agents:${NC}"
  $HAS_KIRO && echo -e "  ${GREEN}✓${NC} Kiro CLI (kiro-cli mcp add)"
  $HAS_CLAUDE && echo -e "  ${GREEN}✓${NC} Claude Code (claude mcp add)"
  $HAS_CURSOR && echo -e "  ${GREEN}✓${NC} Cursor (.cursor/mcp.json)"
  $HAS_CODEX && echo -e "  ${GREEN}✓${NC} Codex (codex mcp)"
  ! $HAS_KIRO && ! $HAS_CLAUDE && ! $HAS_CURSOR && ! $HAS_CODEX && \
    echo -e "  ${RED}✗ No agents detected${NC}"
  echo ""
}

show_list() {
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║         VybeKiit MCP Servers (16 curated + vybekiit)        ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  show_agents
  echo -e "${GREEN}CORE:${NC}"
  jq -r '.servers[] | select(.category == "core") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}FRONTEND:${NC}"
  jq -r '.servers[] | select(.category == "frontend") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}BACKEND:${NC}"
  jq -r '.servers[] | select(.category == "backend") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}PAYMENTS:${NC}"
  jq -r '.servers[] | select(.category == "payments") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}DEPLOY:${NC}"
  jq -r '.servers[] | select(.category == "deploy") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}COMMS / MEDIA / RESEARCH:${NC}"
  jq -r '.servers[] | select(.category == "comms" or .category == "media" or .category == "research") | "  \(.name)\t\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${YELLOW}Tip: Don't install all. Pick 3-6 that match your project.${NC}"
}

# Register a server with Kiro
register_kiro() {
  local name="$1" cmd="$2"
  if echo "$cmd" | grep -q "^remote:"; then
    local url="${cmd#remote:}"
    kiro-cli mcp add --name "$name" --url "$url" --scope global 2>/dev/null && \
      echo -e "    ${CYAN}[kiro]${NC} ${GREEN}✅${NC}" || \
      echo -e "    ${CYAN}[kiro]${NC} ${YELLOW}⚠️ already registered${NC}"
  else
    # Parse command and args
    local base_cmd="${cmd%% *}"
    local args="${cmd#* }"
    if [ "$base_cmd" = "$args" ]; then args=""; fi
    
    if [ -n "$args" ]; then
      kiro-cli mcp add --name "$name" --command "$base_cmd" --args "$args" --scope global 2>/dev/null && \
        echo -e "    ${CYAN}[kiro]${NC} ${GREEN}✅${NC}" || \
        echo -e "    ${CYAN}[kiro]${NC} ${YELLOW}⚠️ already registered${NC}"
    else
      kiro-cli mcp add --name "$name" --command "$base_cmd" --scope global 2>/dev/null && \
        echo -e "    ${CYAN}[kiro]${NC} ${GREEN}✅${NC}" || \
        echo -e "    ${CYAN}[kiro]${NC} ${YELLOW}⚠️ already registered${NC}"
    fi
  fi
}

# Register a server with Claude Code
register_claude() {
  local name="$1" cmd="$2"
  if echo "$cmd" | grep -q "^remote:"; then
    local url="${cmd#remote:}"
    echo -e "    ${CYAN}[claude]${NC} ${YELLOW}remote — configure manually:${NC} claude mcp add $name --transport sse $url"
  else
    claude mcp add "$name" --scope project -- $cmd 2>/dev/null && \
      echo -e "    ${CYAN}[claude]${NC} ${GREEN}✅${NC}" || \
      echo -e "    ${CYAN}[claude]${NC} ${YELLOW}⚠️ already registered${NC}"
  fi
}

# Register a server with Cursor (.cursor/mcp.json)
register_cursor() {
  local name="$1" cmd="$2"
  local cursor_dir="$PROJECT_ROOT/.cursor"
  local mcp_file="$cursor_dir/mcp.json"
  
  mkdir -p "$cursor_dir"
  
  if [ ! -f "$mcp_file" ]; then
    echo '{"mcpServers":{}}' > "$mcp_file"
  fi
  
  if echo "$cmd" | grep -q "^remote:"; then
    local url="${cmd#remote:}"
    local tmp=$(mktemp)
    jq --arg n "$name" --arg u "$url" '.mcpServers[$n] = {"url": $u}' "$mcp_file" > "$tmp" && mv "$tmp" "$mcp_file"
  else
    local base_cmd="${cmd%% *}"
    local args="${cmd#* }"
    if [ "$base_cmd" = "$args" ]; then
      local tmp=$(mktemp)
      jq --arg n "$name" --arg c "$base_cmd" '.mcpServers[$n] = {"command": $c, "args": []}' "$mcp_file" > "$tmp" && mv "$tmp" "$mcp_file"
    else
      # Split args into array
      local tmp=$(mktemp)
      jq --arg n "$name" --arg c "$base_cmd" --arg a "$args" '.mcpServers[$n] = {"command": $c, "args": ($a | split(" "))}' "$mcp_file" > "$tmp" && mv "$tmp" "$mcp_file"
    fi
  fi
  echo -e "    ${CYAN}[cursor]${NC} ${GREEN}✅${NC} → .cursor/mcp.json"
}

register_server() {
  local name="$1"
  local server_json
  server_json=$(jq -r ".servers[] | select(.name == \"$name\")" "$CATALOG" 2>/dev/null)
  
  if [ -z "$server_json" ]; then
    echo -e "  ${RED}✗ Unknown server: $name${NC}"
    return 1
  fi
  
  local cmd desc envs
  cmd=$(echo "$server_json" | jq -r '.command')
  desc=$(echo "$server_json" | jq -r '.description')
  envs=$(echo "$server_json" | jq -r '.env[]?' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
  
  echo -e "  ${GREEN}$name${NC} — $desc"
  
  # Register with each detected agent (or just targeted)
  if [ -z "$TARGET_AGENT" ] || [ "$TARGET_AGENT" = "kiro" ]; then
    $HAS_KIRO && register_kiro "$name" "$cmd"
  fi
  if [ -z "$TARGET_AGENT" ] || [ "$TARGET_AGENT" = "claude" ]; then
    $HAS_CLAUDE && register_claude "$name" "$cmd"
  fi
  if [ -z "$TARGET_AGENT" ] || [ "$TARGET_AGENT" = "cursor" ]; then
    $HAS_CURSOR && register_cursor "$name" "$cmd"
  fi
  
  # Show env requirements
  if [ -n "$envs" ]; then
    echo -e "    ${YELLOW}Needs env:${NC} $envs"
  fi
}

# ─── Parse arguments ──────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  show_list
  echo ""
  echo "Usage: $0 [--agent kiro|claude|cursor] [--list|--all|--recommended|<server1> <server2>...]"
  exit 0
fi

# Check for --agent flag
if [ "$1" = "--agent" ]; then
  shift
  TARGET_AGENT="${1:-}"
  shift
fi

case "${1:-}" in
  --list|-l)
    show_list
    ;;
  --all|-a)
    echo -e "${BLUE}Registering all MCP servers with detected agents...${NC}"
    show_agents
    NAMES=$(jq -r '.servers[].name' "$CATALOG")
    while IFS= read -r name; do
      [ -z "$name" ] && continue
      register_server "$name"
    done <<< "$NAMES"
    echo ""
    echo -e "${GREEN}Done.${NC} Set required env vars, then restart your agents."
    ;;
  --recommended|-r)
    echo -e "${BLUE}Registering recommended MCPs...${NC}"
    show_agents
    # Always core
    register_server "context7"
    register_server "github"
    register_server "vybekiit"
    # Project-type detection
    if [ -f "$PROJECT_ROOT/package.json" ]; then
      grep -q "next\|react" "$PROJECT_ROOT/package.json" 2>/dev/null && register_server "playwright"
      grep -q "supabase" "$PROJECT_ROOT/package.json" 2>/dev/null && register_server "supabase"
      grep -q "stripe" "$PROJECT_ROOT/package.json" 2>/dev/null && register_server "stripe"
      grep -q "vercel" "$PROJECT_ROOT/package.json" 2>/dev/null && register_server "vercel"
    fi
    echo ""
    echo -e "${GREEN}Done.${NC} Run $0 --list to see more."
    ;;
  --payments)
    echo -e "${BLUE}Registering payment MCPs...${NC}"
    show_agents
    register_server "stripe"
    register_server "paypal"
    echo ""
    echo -e "${GREEN}Done.${NC}"
    ;;
  *)
    echo -e "${BLUE}Registering selected MCPs...${NC}"
    show_agents
    for name in "$@"; do
      register_server "$name"
    done
    ;;
esac

echo ""
echo -e "${YELLOW}Remember:${NC} Agents won't auto-load all MCPs. They know they exist and use them when relevant."
