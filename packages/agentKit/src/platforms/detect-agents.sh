#!/usr/bin/env bash
# =============================================================================
# VybeKiit Agent Platform Detector
# Detects installed AI coding agents, shows missing ones, offers install commands.
#
# Usage:
#   bash detect-agents.sh              # Show status of all agents
#   bash detect-agents.sh --json       # Output JSON (for programmatic use)
#   bash detect-agents.sh --install    # Offer to install missing CLI agents
#
# Supports 15 platforms:
#   CLI agents: Claude Code, Kiro, Codex, Gemini, Cline, Kilo, Aider, Augment (auggie)
#   IDE launchers: Cursor, Windsurf, Zed
#   Extensions: Copilot (gh ext), Junie (JetBrains plugin), Roo Code (VS Code ext)
#   API-only: Kimi (Moonshot AI) — no CLI
# =============================================================================

set -uo pipefail

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m'

MODE="${1:-}"

# =============================================================================
# Detection Functions
# =============================================================================

declare -a DETECTED=()
declare -a MISSING=()
declare -a SKIPPED=()

check_binary() {
  local name="$1"
  local binary="$2"
  local install_cmd="$3"
  local type="$4" # cli | ide | ext | api

  if command -v "$binary" &>/dev/null; then
    local version=""
    # Try to get version (best-effort, silent on failure)
    case "$binary" in
      claude)  version=$("$binary" --version 2>/dev/null | head -1) ;;
      kiro)    version=$("$binary" --version 2>/dev/null | head -1) ;;
      codex)   version=$("$binary" --version 2>/dev/null | head -1) ;;
      gemini)  version=$("$binary" --version 2>/dev/null | head -1) ;;
      cline)   version=$("$binary" --version 2>/dev/null | head -1) ;;
      kilo)    version=$("$binary" --version 2>/dev/null | head -1) ;;
      aider)   version=$("$binary" --version 2>/dev/null | head -1) ;;
      auggie)  version=$("$binary" --version 2>/dev/null | head -1) ;;
      cursor)  version="(IDE launcher)" ;;
      windsurf) version="(IDE launcher)" ;;
      zed)     version="(editor)" ;;
    esac
    DETECTED+=("$name|$binary|$version|$type")
    return 0
  else
    MISSING+=("$name|$binary|$install_cmd|$type")
    return 1
  fi
}

check_copilot() {
  if command -v gh &>/dev/null; then
    if gh extension list 2>/dev/null | grep -q "copilot"; then
      local version=$(gh copilot --version 2>/dev/null | head -1)
      DETECTED+=("Copilot|gh copilot|$version|ext")
      return 0
    fi
  fi
  MISSING+=("Copilot|gh copilot|gh extension install github/gh-copilot|ext")
  return 1
}

check_junie() {
  # Junie is IDE-only — detect .junie/ in project or IntelliJ installation
  if [[ -d ".junie" ]] || [[ -d "$HOME/Library/Application Support/JetBrains" ]] || [[ -d "$HOME/.local/share/JetBrains" ]]; then
    DETECTED+=("Junie|N/A|(JetBrains plugin)|ide")
  else
    SKIPPED+=("Junie|N/A|JetBrains Marketplace → Junie plugin|ide")
  fi
}

check_roo() {
  # Roo Code is VS Code extension only (no official standalone CLI)
  if command -v code &>/dev/null; then
    if code --list-extensions 2>/dev/null | grep -qi "roo"; then
      DETECTED+=("Roo Code|N/A|(VS Code extension)|ext")
      return 0
    fi
  fi
  SKIPPED+=("Roo Code|N/A|VS Code ext: rooveterinaryinc.roo-cline|ext")
}

check_kimi() {
  # Kimi is API-only (Moonshot AI) — no CLI/IDE integration
  SKIPPED+=("Kimi|N/A|API-only (api.moonshot.cn)|api")
}

# =============================================================================
# Run All Checks
# =============================================================================

run_detection() {
  check_binary "Claude Code"  "claude"    "npm i -g @anthropic-ai/claude-code"   "cli"
  check_binary "Kiro"         "kiro"      "npm i -g kiro"                        "cli"
  check_binary "Cursor"       "cursor"    "Download from cursor.com"             "ide"
  check_binary "Codex"        "codex"     "npm i -g @openai/codex"              "cli"
  check_binary "Gemini CLI"   "gemini"    "npm i -g @google/gemini-cli"         "cli"
  check_copilot
  check_binary "Windsurf"     "windsurf"  "brew install --cask windsurf"         "ide"
  check_junie
  check_binary "Cline"        "cline"     "npm i -g cline"                       "cli"
  check_binary "Kilo Code"    "kilo"      "npm i -g @kilocode/cli"              "cli"
  check_binary "Aider"        "aider"     "brew install aider"                   "cli"
  check_roo
  check_binary "Augment"      "auggie"    "npm i -g @augmentcode/auggie"        "cli"
  check_binary "Zed"          "zed"       "brew install --cask zed"             "ide"
  check_kimi
}

# =============================================================================
# Output Formatters
# =============================================================================

output_table() {
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║       VybeKiit Agent Platform Detection (15 platforms)     ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # Installed
  if [[ ${#DETECTED[@]} -gt 0 ]]; then
    echo -e "  ${GREEN}● Installed (${#DETECTED[@]})${NC}"
    for entry in "${DETECTED[@]}"; do
      IFS='|' read -r name binary version type <<< "$entry"
      local type_badge=""
      case "$type" in
        cli) type_badge="${GREEN}CLI${NC}" ;;
        ide) type_badge="${CYAN}IDE${NC}" ;;
        ext) type_badge="${YELLOW}EXT${NC}" ;;
      esac
      printf "    ${GREEN}✓${NC}  %-14s ${DIM}%-10s${NC} %s  [%b]\n" "$name" "$binary" "$version" "$type_badge"
    done
    echo ""
  fi

  # Not installed (installable)
  if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo -e "  ${RED}○ Not Installed (${#MISSING[@]})${NC}"
    for entry in "${MISSING[@]}"; do
      IFS='|' read -r name binary install_cmd type <<< "$entry"
      local type_badge=""
      case "$type" in
        cli) type_badge="${GREEN}CLI${NC}" ;;
        ide) type_badge="${CYAN}IDE${NC}" ;;
        ext) type_badge="${YELLOW}EXT${NC}" ;;
      esac
      printf "    ${RED}✗${NC}  %-14s → ${DIM}%s${NC}  [%b]\n" "$name" "$install_cmd" "$type_badge"
    done
    echo ""
  fi

  # Skipped (IDE-only / API-only)
  if [[ ${#SKIPPED[@]} -gt 0 ]]; then
    echo -e "  ${DIM}◌ Not Applicable (${#SKIPPED[@]})${NC}"
    for entry in "${SKIPPED[@]}"; do
      IFS='|' read -r name binary note type <<< "$entry"
      printf "    ${DIM}○  %-14s — %s${NC}\n" "$name" "$note"
    done
    echo ""
  fi

  echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
  echo -e "  Summary: ${GREEN}${#DETECTED[@]} installed${NC} · ${RED}${#MISSING[@]} available to install${NC} · ${DIM}${#SKIPPED[@]} N/A${NC}"
  echo ""

  # Config generation hint
  local config_ready=()
  for entry in "${DETECTED[@]}"; do
    IFS='|' read -r name binary version type <<< "$entry"
    config_ready+=("$name")
  done
  if [[ ${#config_ready[@]} -gt 0 ]]; then
    echo -e "  ${CYAN}Tip:${NC} Run ${DIM}generate-platform-configs.sh --detect${NC} to auto-generate"
    echo -e "       instruction files for your installed agents."
  fi
  echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
}

output_json() {
  echo "{"
  echo "  \"detected\": ["
  local first=true
  for entry in "${DETECTED[@]}"; do
    IFS='|' read -r name binary version type <<< "$entry"
    [[ "$first" == "true" ]] || echo ","
    printf '    {"name":"%s","binary":"%s","version":"%s","type":"%s"}' "$name" "$binary" "$version" "$type"
    first=false
  done
  echo ""
  echo "  ],"
  echo "  \"missing\": ["
  first=true
  for entry in "${MISSING[@]}"; do
    IFS='|' read -r name binary install_cmd type <<< "$entry"
    [[ "$first" == "true" ]] || echo ","
    printf '    {"name":"%s","binary":"%s","install":"%s","type":"%s"}' "$name" "$binary" "$install_cmd" "$type"
    first=false
  done
  echo ""
  echo "  ],"
  echo "  \"skipped\": ["
  first=true
  for entry in "${SKIPPED[@]}"; do
    IFS='|' read -r name binary note type <<< "$entry"
    [[ "$first" == "true" ]] || echo ","
    printf '    {"name":"%s","note":"%s","type":"%s"}' "$name" "$note" "$type"
    first=false
  done
  echo ""
  echo "  ],"
  echo "  \"summary\": {"
  echo "    \"installed\": ${#DETECTED[@]},"
  echo "    \"available\": ${#MISSING[@]},"
  echo "    \"not_applicable\": ${#SKIPPED[@]}"
  echo "  }"
  echo "}"
}

offer_install() {
  output_table
  echo ""

  # Filter to only CLI-installable agents
  local installable=()
  for entry in "${MISSING[@]}"; do
    IFS='|' read -r name binary install_cmd type <<< "$entry"
    if [[ "$type" == "cli" || "$type" == "ext" ]]; then
      installable+=("$entry")
    fi
  done

  if [[ ${#installable[@]} -eq 0 ]]; then
    echo -e "  ${GREEN}All CLI agents are already installed!${NC}"
    return 0
  fi

  echo -e "  ${YELLOW}Install missing CLI agents?${NC}"
  echo ""
  for i in "${!installable[@]}"; do
    IFS='|' read -r name binary install_cmd type <<< "${installable[$i]}"
    printf "    [%d] %s  →  %s\n" $((i+1)) "$name" "$install_cmd"
  done
  echo ""
  printf "    [a] Install ALL    [n] Skip\n"
  echo ""
  read -rp "  Choice: " choice

  case "$choice" in
    a|A|all)
      for entry in "${installable[@]}"; do
        IFS='|' read -r name binary install_cmd type <<< "$entry"
        echo -e "  ${CYAN}→${NC} Installing $name..."
        if eval "$install_cmd" 2>/dev/null; then
          echo -e "    ${GREEN}✓${NC} $name installed"
        else
          echo -e "    ${RED}✗${NC} $name failed — run manually: $install_cmd"
        fi
      done
      ;;
    n|N|"")
      echo "  Skipped."
      ;;
    *)
      # Install specific one
      local idx=$((choice - 1))
      if [[ $idx -ge 0 && $idx -lt ${#installable[@]} ]]; then
        IFS='|' read -r name binary install_cmd type <<< "${installable[$idx]}"
        echo -e "  ${CYAN}→${NC} Installing $name..."
        if eval "$install_cmd" 2>/dev/null; then
          echo -e "    ${GREEN}✓${NC} $name installed"
        else
          echo -e "    ${RED}✗${NC} Failed — run manually: $install_cmd"
        fi
      else
        echo "  Invalid choice."
      fi
      ;;
  esac
}

# =============================================================================
# Main
# =============================================================================

run_detection

case "$MODE" in
  --json)    output_json ;;
  --install) offer_install ;;
  *)         output_table ;;
esac
