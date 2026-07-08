#!/usr/bin/env bash
# =============================================================================
# VybeKiit Mobile Dev Environment Auto-Installer
# Detects OS and installs required tooling for mobile (Expo/React Native) dev.
#
# On macOS:
#   - Xcode CLI Tools
#   - Xcode (full, via xcodes or App Store prompt)
#   - CocoaPods
#   - iOS Simulator
#   - Watchman
#   - Java (for Android)
#   - Android Studio (optional)
#
# On Linux:
#   - Java (for Android)
#   - Android SDK
#   - Watchman
#
# Usage:
#   bash setup-mobile-env.sh           # Auto-detect OS, install everything needed
#   bash setup-mobile-env.sh --check   # Check only, don't install
#   bash setup-mobile-env.sh --ios     # iOS only (macOS)
#   bash setup-mobile-env.sh --android # Android only
# =============================================================================

set -uo pipefail

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

MODE="${1:---all}"
OS="$(uname -s)"
ARCH="$(uname -m)"

# =============================================================================
# Utility Functions
# =============================================================================

log_step() { echo -e "  ${CYAN}→${NC} $1"; }
log_ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
log_skip() { echo -e "  ${YELLOW}⏭${NC}  $1 ${DIM}(already installed)${NC}"; }
log_warn() { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
log_fail() { echo -e "  ${RED}✗${NC} $1"; }

check_only() { [[ "$MODE" == "--check" ]]; }

# =============================================================================
# macOS: Xcode & iOS Toolchain
# =============================================================================

check_xcode_clt() {
  if xcode-select -p &>/dev/null; then
    local path
    path=$(xcode-select -p)
    log_ok "Xcode CLI Tools → $path"
    return 0
  fi
  return 1
}

install_xcode_clt() {
  if check_xcode_clt; then return 0; fi
  if check_only; then
    log_fail "Xcode Command Line Tools — NOT installed"
    return 1
  fi

  log_step "Installing Xcode Command Line Tools..."
  # Trigger the install dialog
  xcode-select --install 2>/dev/null

  # Wait for installation (the dialog is async)
  echo -e "    ${DIM}A system dialog should appear. Click 'Install' and wait...${NC}"
  echo -e "    ${DIM}This may take 5-10 minutes.${NC}"

  # Poll until installed or timeout (10 min)
  local timeout=600
  local elapsed=0
  while ! xcode-select -p &>/dev/null; do
    sleep 5
    elapsed=$((elapsed + 5))
    if [[ $elapsed -ge $timeout ]]; then
      log_fail "Timed out waiting for Xcode CLT install"
      return 1
    fi
  done

  log_ok "Xcode Command Line Tools installed"
}

check_xcode_full() {
  if [[ -d "/Applications/Xcode.app" ]]; then
    local version
    version=$(/usr/bin/xcodebuild -version 2>/dev/null | head -1)
    log_ok "Xcode (full) → $version"
    return 0
  fi
  return 1
}

install_xcode_full() {
  if check_xcode_full; then return 0; fi
  if check_only; then
    log_fail "Xcode (full) — NOT installed (required for iOS builds)"
    return 1
  fi

  log_step "Xcode (full) is required for iOS simulator and native builds"

  # Try xcodes CLI (fastest headless install)
  if command -v xcodes &>/dev/null; then
    log_step "Using 'xcodes' to install latest Xcode..."
    xcodes install --latest --experimental-unxip
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
    log_ok "Xcode installed via xcodes"
    return 0
  fi

  # Try mas (Mac App Store CLI)
  if command -v mas &>/dev/null; then
    log_step "Using 'mas' to install Xcode from App Store..."
    # Xcode's App Store ID is 497799835
    mas install 497799835
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
    log_ok "Xcode installed via mas"
    return 0
  fi

  # Fallback: prompt user
  log_warn "Cannot auto-install Xcode without 'xcodes' or 'mas'"
  echo -e "    ${BOLD}Options:${NC}"
  echo -e "    1. ${DIM}brew install xcodes && xcodes install --latest${NC}"
  echo -e "    2. ${DIM}brew install mas && mas install 497799835${NC}"
  echo -e "    3. ${DIM}Open App Store → Search 'Xcode' → Install${NC}"
  echo ""

  # Offer to install xcodes via brew
  if command -v brew &>/dev/null; then
    read -rp "    Install 'xcodes' via Homebrew and continue? [Y/n] " yn
    case "${yn:-Y}" in
      [Yy]*)
        brew install xcodes
        log_step "Installing latest Xcode via xcodes (this takes 10-30 min)..."
        xcodes install --latest --experimental-unxip
        sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
        log_ok "Xcode installed"
        return 0
        ;;
    esac
  fi

  log_warn "Skipping Xcode install — please install manually"
  return 1
}

accept_xcode_license() {
  if /usr/bin/xcodebuild -license check &>/dev/null 2>&1; then
    return 0
  fi
  if check_only; then
    log_warn "Xcode license not accepted"
    return 1
  fi
  log_step "Accepting Xcode license..."
  sudo xcodebuild -license accept
  log_ok "Xcode license accepted"
}

check_ios_simulator() {
  if xcrun simctl list devices 2>/dev/null | grep -q "iPhone"; then
    local sim
    sim=$(xcrun simctl list devices available 2>/dev/null | grep "iPhone" | head -1 | sed 's/^[[:space:]]*//')
    log_ok "iOS Simulator available → $sim"
    return 0
  fi
  return 1
}

install_ios_simulator() {
  if check_ios_simulator; then return 0; fi
  if check_only; then
    log_fail "iOS Simulator — no devices available"
    return 1
  fi

  log_step "Installing iOS Simulator runtime..."
  # xcodebuild -downloadPlatform iOS (Xcode 14.1+)
  if xcodebuild -downloadPlatform iOS 2>/dev/null; then
    log_ok "iOS Simulator runtime downloaded"
  else
    log_warn "Could not auto-download. Open Xcode → Settings → Platforms → iOS → Get"
  fi
}

check_cocoapods() {
  if command -v pod &>/dev/null; then
    local version
    version=$(pod --version 2>/dev/null)
    log_ok "CocoaPods → $version"
    return 0
  fi
  return 1
}

install_cocoapods() {
  if check_cocoapods; then return 0; fi
  if check_only; then
    log_fail "CocoaPods — NOT installed"
    return 1
  fi

  log_step "Installing CocoaPods..."
  if command -v brew &>/dev/null; then
    brew install cocoapods
  else
    sudo gem install cocoapods
  fi
  log_ok "CocoaPods installed"
}

# =============================================================================
# Cross-Platform: Shared Tools
# =============================================================================

check_homebrew() {
  if command -v brew &>/dev/null; then
    log_ok "Homebrew → $(brew --version | head -1)"
    return 0
  fi
  return 1
}

install_homebrew() {
  if check_homebrew; then return 0; fi
  if check_only; then
    log_fail "Homebrew — NOT installed"
    return 1
  fi

  log_step "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  log_ok "Homebrew installed"
}

check_watchman() {
  if command -v watchman &>/dev/null; then
    local version
    version=$(watchman --version 2>/dev/null)
    log_ok "Watchman → $version"
    return 0
  fi
  return 1
}

install_watchman() {
  if check_watchman; then return 0; fi
  if check_only; then
    log_fail "Watchman — NOT installed (recommended for RN file watching)"
    return 1
  fi

  log_step "Installing Watchman..."
  if command -v brew &>/dev/null; then
    brew install watchman
  else
    log_warn "Install Watchman manually: https://facebook.github.io/watchman/docs/install"
    return 1
  fi
  log_ok "Watchman installed"
}

check_node() {
  if command -v node &>/dev/null; then
    local version
    version=$(node --version 2>/dev/null)
    log_ok "Node.js → $version"
    return 0
  fi
  return 1
}

install_node() {
  if check_node; then return 0; fi
  if check_only; then
    log_fail "Node.js — NOT installed"
    return 1
  fi

  log_step "Installing Node.js..."
  if command -v brew &>/dev/null; then
    brew install node
  elif command -v nvm &>/dev/null; then
    nvm install --lts
  else
    log_warn "Install Node.js from https://nodejs.org"
    return 1
  fi
  log_ok "Node.js installed"
}

check_java() {
  if command -v java &>/dev/null; then
    local version
    version=$(java -version 2>&1 | head -1)
    log_ok "Java → $version"
    return 0
  fi
  return 1
}

install_java() {
  if check_java; then return 0; fi
  if check_only; then
    log_fail "Java (JDK) — NOT installed (required for Android)"
    return 1
  fi

  log_step "Installing Java (Zulu JDK 17)..."
  if command -v brew &>/dev/null; then
    brew install --cask zulu@17
  else
    log_warn "Install JDK 17 from https://www.azul.com/downloads/"
    return 1
  fi
  log_ok "Java installed"
}

check_android_sdk() {
  if [[ -n "${ANDROID_HOME:-}" ]] && [[ -d "$ANDROID_HOME" ]]; then
    log_ok "Android SDK → $ANDROID_HOME"
    return 0
  fi
  # Common locations
  for dir in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" "/usr/local/share/android-sdk"; do
    if [[ -d "$dir" ]]; then
      log_ok "Android SDK → $dir"
      return 0
    fi
  done
  return 1
}

install_android_sdk() {
  if check_android_sdk; then return 0; fi
  if check_only; then
    log_fail "Android SDK — NOT found"
    return 1
  fi

  log_warn "Android SDK not found."
  echo -e "    ${BOLD}Recommended:${NC} Install Android Studio from https://developer.android.com/studio"
  echo -e "    ${DIM}Android Studio includes the SDK, emulator, and build tools.${NC}"

  if command -v brew &>/dev/null; then
    read -rp "    Install Android Studio via Homebrew? [Y/n] " yn
    case "${yn:-Y}" in
      [Yy]*)
        brew install --cask android-studio
        log_ok "Android Studio installed — open it to complete SDK setup"
        ;;
    esac
  fi
}

check_eas_cli() {
  if command -v eas &>/dev/null; then
    local version
    version=$(eas --version 2>/dev/null)
    log_ok "EAS CLI → $version"
    return 0
  fi
  return 1
}

install_eas_cli() {
  if check_eas_cli; then return 0; fi
  if check_only; then
    log_fail "EAS CLI — NOT installed (required for Expo builds)"
    return 1
  fi

  log_step "Installing EAS CLI..."
  npm install -g eas-cli
  log_ok "EAS CLI installed"
}

# =============================================================================
# Main Flow
# =============================================================================

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     VybeKiit Mobile Dev Environment Setup                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  OS: ${BOLD}$OS ($ARCH)${NC}  Mode: ${BOLD}$MODE${NC}"
echo ""

if [[ "$OS" != "Darwin" && ("$MODE" == "--ios" || "$MODE" == "--all") ]]; then
  log_warn "iOS development requires macOS. Skipping iOS setup."
  if [[ "$MODE" == "--ios" ]]; then
    exit 1
  fi
  MODE="--android"
fi

# --- Common Prerequisites ---
echo -e "${CYAN}─── Prerequisites ───────────────────────────────────────────${NC}"
if [[ "$OS" == "Darwin" ]]; then
  install_homebrew
fi
install_node
install_watchman
echo ""

# --- iOS (macOS only) ---
if [[ "$OS" == "Darwin" && ("$MODE" == "--all" || "$MODE" == "--ios") ]]; then
  echo -e "${CYAN}─── iOS Toolchain ───────────────────────────────────────────${NC}"
  install_xcode_clt
  install_xcode_full
  if [[ -d "/Applications/Xcode.app" ]]; then
    accept_xcode_license
    install_ios_simulator
  fi
  install_cocoapods
  echo ""
fi

# --- Android ---
if [[ "$MODE" == "--all" || "$MODE" == "--android" ]]; then
  echo -e "${CYAN}─── Android Toolchain ───────────────────────────────────────${NC}"
  install_java
  install_android_sdk
  echo ""
fi

# --- Expo / EAS ---
echo -e "${CYAN}─── Expo & Build Tools ──────────────────────────────────────${NC}"
install_eas_cli
echo ""

# --- Summary ---
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
if check_only; then
  echo -e "  ${YELLOW}Check complete.${NC} Review missing items above."
else
  echo -e "  ${GREEN}Setup complete!${NC}"
  echo ""
  echo -e "  Next steps:"
  if [[ "$OS" == "Darwin" ]]; then
    echo "    • Open Xcode once to finish component installation"
    echo "    • Run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  fi
  echo "    • Run: npx expo start to launch your app"
  echo "    • Run: eas build --platform ios (for device builds)"
fi
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
