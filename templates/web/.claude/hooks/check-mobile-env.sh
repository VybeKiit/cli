#!/usr/bin/env bash
# =============================================================================
# Hook: check-mobile-env (SessionStart, P2)
# Detects if working on mobile template and verifies iOS/Android toolchain.
# Only fires on macOS for iOS checks. Reports missing tools as warnings.
# =============================================================================

set -uo pipefail
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HOOK_DIR/_runner.sh"

vybekiit_gate 2

# Only relevant on SessionStart — check if we're in a mobile project
# Look for mobile signals: app.json with expo, or template name
PROJECT_DIR="${VYBEKIIT_PROJECT_DIR:-.}"

# Detect mobile project
is_mobile=false
if [[ -f "$PROJECT_DIR/app.json" ]]; then
  if grep -q '"expo"' "$PROJECT_DIR/app.json" 2>/dev/null; then
    is_mobile=true
  fi
fi
if [[ -f "$PROJECT_DIR/expo-env.d.ts" ]] || [[ -f "$PROJECT_DIR/app.config.ts" ]]; then
  is_mobile=true
fi
# Check template marker
if [[ -f "$PROJECT_DIR/.vybekiit-template" ]]; then
  if grep -q "mobile" "$PROJECT_DIR/.vybekiit-template" 2>/dev/null; then
    is_mobile=true
  fi
fi

if [[ "$is_mobile" != "true" ]]; then
  exit 0
fi

# --- Mobile project detected: check toolchain ---
OS="$(uname -s)"
missing=()

# Always needed
command -v node &>/dev/null || missing+=("Node.js")
command -v watchman &>/dev/null || missing+=("watchman")

# iOS (macOS only)
if [[ "$OS" == "Darwin" ]]; then
  xcode-select -p &>/dev/null || missing+=("Xcode CLT")
  [[ -d "/Applications/Xcode.app" ]] || missing+=("Xcode")
  command -v pod &>/dev/null || missing+=("CocoaPods")
  # Check simulator
  if ! xcrun simctl list devices 2>/dev/null | grep -q "iPhone"; then
    missing+=("iOS Simulator")
  fi
fi

# Android
command -v java &>/dev/null || missing+=("Java/JDK")
if [[ -z "${ANDROID_HOME:-}" ]] && [[ ! -d "$HOME/Library/Android/sdk" ]] && [[ ! -d "$HOME/Android/Sdk" ]]; then
  missing+=("Android SDK")
fi

# EAS
command -v eas &>/dev/null || missing+=("eas-cli")

if [[ ${#missing[@]} -eq 0 ]]; then
  # All good — zero output (pass)
  exit 0
fi

# Report missing tools
missing_str=$(IFS=', '; echo "${missing[*]}")

# Find the setup script
SETUP_SCRIPT=""
if [[ -f "$HOOK_DIR/../platforms/setup-mobile-env.sh" ]]; then
  SETUP_SCRIPT="bash .claude/platforms/setup-mobile-env.sh"
elif [[ -f "$PROJECT_DIR/.claude/platforms/setup-mobile-env.sh" ]]; then
  SETUP_SCRIPT="bash .claude/platforms/setup-mobile-env.sh"
fi

if [[ -n "$SETUP_SCRIPT" ]]; then
  vybekiit_warn "Mobile env missing: $missing_str. Run: $SETUP_SCRIPT"
else
  vybekiit_warn "Mobile env missing: $missing_str. Install Xcode + tools for iOS builds."
fi
