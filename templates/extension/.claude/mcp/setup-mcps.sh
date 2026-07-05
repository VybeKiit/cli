#!/usr/bin/env bash
# setup-mcps.sh — Register MCP servers with Claude Code
# Registers servers so Claude knows they exist, without auto-loading all into context.
#
# Usage:
#   ./setup-mcps.sh --list              # Show available MCPs
#   ./setup-mcps.sh --all               # Register all 15 MCPs
#   ./setup-mcps.sh context7 github     # Register specific MCPs
#   ./setup-mcps.sh --category core     # Register all in a category
#   ./setup-mcps.sh --recommended       # Register core + your project type
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CATALOG="$SCRIPT_DIR/mcp-servers.json"

if [ ! -f "$CATALOG" ]; then
  echo "❌ MCP catalog not found: $CATALOG"
  exit 1
fi

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

show_list() {
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║            VybeKiit MCP Servers (15 curated)                ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}CORE (install these first):${NC}"
  jq -r '.servers[] | select(.category == "core") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}FRONTEND:${NC}"
  jq -r '.servers[] | select(.category == "frontend") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}BACKEND:${NC}"
  jq -r '.servers[] | select(.category == "backend") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}DESIGN:${NC}"
  jq -r '.servers[] | select(.category == "design") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}OPS / DEPLOY:${NC}"
  jq -r '.servers[] | select(.category == "ops" or .category == "deploy") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}PAYMENTS / COMMS:${NC}"
  jq -r '.servers[] | select(.category == "payments" or .category == "comms") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${GREEN}MEDIA / RESEARCH:${NC}"
  jq -r '.servers[] | select(.category == "media" or .category == "research") | "  \(.name)\t\tP\(.priority)\t\(.description)"' "$CATALOG"
  echo ""
  echo -e "${YELLOW}Tip: Don't install all 15. Pick 3-6 that match your project.${NC}"
  echo "  Core recommends: context7 + github"
  echo "  Frontend add: playwright + figma"
  echo "  Backend add: supabase + cloudflare"
}

register_server() {
  local name="$1"
  local server_json
  server_json=$(jq -r ".servers[] | select(.name == \"$name\")" "$CATALOG" 2>/dev/null)
  
  if [ -z "$server_json" ]; then
    echo -e "  ${RED}✗ Unknown server: $name${NC}"
    return 1
  fi
  
  local cmd
  cmd=$(echo "$server_json" | jq -r '.command')
  local envs
  envs=$(echo "$server_json" | jq -r '.env[]?' 2>/dev/null)
  local desc
  desc=$(echo "$server_json" | jq -r '.description')
  
  # Handle remote MCPs differently
  if echo "$cmd" | grep -q "^remote:"; then
    local url="${cmd#remote:}"
    echo -e "  ${YELLOW}⚡ $name (remote): $url${NC}"
    echo "     → Configure manually: claude mcp add $name --transport sse $url"
  else
    # Register with Claude Code
    if command -v claude &>/dev/null; then
      claude mcp add "$name" --scope project -- $cmd 2>/dev/null && \
        echo -e "  ${GREEN}✅ $name${NC} — $desc" || \
        echo -e "  ${YELLOW}⚠️  $name — already registered or claude CLI not available${NC}"
    else
      echo -e "  ${YELLOW}📋 $name${NC} — $desc"
      echo "     Command: claude mcp add $name --scope project -- $cmd"
    fi
  fi
  
  # Print env requirements
  if [ -n "$envs" ]; then
    echo -e "     ${YELLOW}Needs env:${NC} $envs"
  fi
}

# Parse arguments
if [ $# -eq 0 ]; then
  show_list
  echo ""
  echo "Usage: $0 --list | --all | --recommended | --category <cat> | <server1> <server2> ..."
  exit 0
fi

case "$1" in
  --list|-l)
    show_list
    ;;
  --all|-a)
    echo -e "${BLUE}Registering all 15 MCP servers...${NC}"
    echo ""
    NAMES=$(jq -r '.servers[].name' "$CATALOG")
    while IFS= read -r name; do
      register_server "$name"
    done <<< "$NAMES"
    echo ""
    echo -e "${GREEN}Done.${NC} Configure required env vars in .env then restart Claude Code."
    ;;
  --recommended|-r)
    echo -e "${BLUE}Registering recommended MCPs (core + detected project type)...${NC}"
    echo ""
    # Always register core
    for name in context7 github; do
      register_server "$name"
    done
    # Detect project type and add relevant
    if [ -f "package.json" ]; then
      if grep -q "next\|react" package.json 2>/dev/null; then
        register_server "playwright"
        register_server "vercel"
      fi
      if grep -q "supabase" package.json 2>/dev/null; then
        register_server "supabase"
      fi
      if grep -q "stripe" package.json 2>/dev/null; then
        register_server "stripe"
      fi
    fi
    echo ""
    echo -e "${GREEN}Done.${NC} Run $0 --list to see more options."
    ;;
  --category|-c)
    shift
    CATEGORY="${1:-}"
    if [ -z "$CATEGORY" ]; then
      echo "Usage: $0 --category <core|frontend|backend|design|ops|deploy|payments|comms|media|research>"
      exit 1
    fi
    echo -e "${BLUE}Registering $CATEGORY MCPs...${NC}"
    echo ""
    NAMES=$(jq -r ".servers[] | select(.category == \"$CATEGORY\") | .name" "$CATALOG")
    while IFS= read -r name; do
      [ -z "$name" ] && continue
      register_server "$name"
    done <<< "$NAMES"
    ;;
  *)
    echo -e "${BLUE}Registering selected MCPs...${NC}"
    echo ""
    for name in "$@"; do
      register_server "$name"
    done
    ;;
esac

echo ""
echo -e "${YELLOW}Remember: Claude won't auto-load these into context.${NC}"
echo "It knows they exist and will use them when relevant to your task."
