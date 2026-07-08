#!/usr/bin/env bash
# =============================================================================
# VybeKiit Multi-Platform Agent Config Generator
# Generates platform-specific instruction/rules files from shared VybeKiit rules
#
# Supported platforms (13):
#   - Claude Code      (.claude/ + CLAUDE.md + hooks)
#   - Kiro             (.kiro/steering/vybekiit.md)
#   - Cursor           (.cursor/rules/vybekiit.mdc)
#   - OpenAI Codex     (AGENTS.md)
#   - Gemini CLI       (GEMINI.md)
#   - GitHub Copilot   (.github/copilot-instructions.md)
#   - Windsurf         (.windsurfrules)
#   - JetBrains/Junie  (.junie/guidelines.md)
#   - Cline            (.clinerules)
#   - Aider            (CONVENTIONS.md)
#   - Roo Code         (.roo/rules.md)
#   - Augment          (.augment-guidelines)
#   - Zed AI           (.zed/rules.md)
#
# Usage:
#   bash generate-platform-configs.sh [target-dir] [--detect|--all|platform1,platform2]
#
# Detection: auto-detects which platforms are in use based on existing config files
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ALL_PLATFORMS="claude kiro cursor codex gemini copilot windsurf jetbrains cline kilo aider roo augment zed"

# =============================================================================
# Platform Detection
# =============================================================================

detect_platforms() {
  local dir="${1:-.}"
  local platforms=()

  [[ -d "$dir/.claude" || -f "$dir/CLAUDE.md" ]]                         && platforms+=("claude")
  [[ -d "$dir/.kiro" ]]                                                   && platforms+=("kiro")
  [[ -d "$dir/.cursor" || -f "$dir/.cursorrules" ]]                       && platforms+=("cursor")
  [[ -f "$dir/AGENTS.md" || -f "$dir/.codex.yaml" ]]                     && platforms+=("codex")
  [[ -f "$dir/GEMINI.md" || -d "$dir/.gemini" ]]                         && platforms+=("gemini")
  [[ -d "$dir/.github" || -f "$dir/.github/copilot-instructions.md" ]]   && platforms+=("copilot")
  [[ -f "$dir/.windsurfrules" ]]                                          && platforms+=("windsurf")
  [[ -d "$dir/.junie" || -d "$dir/.idea" ]]                              && platforms+=("jetbrains")
  [[ -f "$dir/.clinerules" || -d "$dir/.cline" ]]                        && platforms+=("cline")
  [[ -d "$dir/.kilo" || -f "$dir/kilo.jsonc" ]]                           && platforms+=("kilo")
  [[ -f "$dir/CONVENTIONS.md" || -f "$dir/.aider.conf.yml" ]]            && platforms+=("aider")
  [[ -d "$dir/.roo" ]]                                                    && platforms+=("roo")
  [[ -f "$dir/.augment-guidelines" || -d "$dir/.augment" ]]              && platforms+=("augment")
  [[ -d "$dir/.zed" ]]                                                    && platforms+=("zed")

  if [[ ${#platforms[@]} -eq 0 ]]; then
    # Default: generate for the top-5 most common platforms
    echo "claude kiro cursor codex gemini copilot"
  else
    echo "${platforms[*]}"
  fi
}

# =============================================================================
# Shared Rules (source of truth — matches our hooks)
# =============================================================================

generate_rules_markdown() {
  cat << 'RULES_EOF'
# VybeKiit Project Rules

## Critical (Always Enforce)

### No direct push to main/master
Never push directly to main or master. Always use feature branches + PRs.

### No force delete (rm -rf)
Never run `rm -rf` on source directories. Only allowed for: node_modules, dist, .next, .turbo, target, .cache, build.

### No destructive database operations
Block DROP TABLE, DROP DATABASE, TRUNCATE TABLE, DELETE FROM without WHERE. Use migrations.

### No secrets in source code
Never hardcode secrets in source: AWS keys (AKIA...), OpenAI keys (sk-...), GitHub tokens (ghp_...), private keys, Slack tokens. Use env vars or secrets manager.

### Verify before completing
Before marking done: TypeScript compiles, tests pass, build succeeds.

## Important

### Auto-format on save
Use Biome (preferred) or Prettier. Format all changed files.

### Validate package installs
Check packages aren't typosquatting. Flag names ≤2 chars or starting with numbers.

### No server env vars in client code
Client files only use: NEXT_PUBLIC_, VITE_, EXPO_PUBLIC_. Keep DATABASE_URL etc. server-side.

## Quality

### Use @effect/schema, not Zod
This project uses Effect. Import `Schema` from `@effect/schema`.

### No `any` type
Never use `: any`, `as any`, `<any>`. Use `unknown` + type guards. Exception: `.d.ts` files.

### No hardcoded URLs
Don't hardcode deployment URLs. Use environment variables.

## Hygiene

### Use Effect.log, not console.log
Production source: `Effect.log`/`Effect.logWarning`/`Effect.logError`. console.log allowed in tests/scripts/CLI only.

### Error handling required
All async functions must have try/catch, .catch(), or Effect.tryPromise.

### File size limit: 300 lines
Split files exceeding 300 lines into smaller modules.

## Style

### Accessibility
Interactive elements need `aria-label`, `role`, or `accessibilityLabel`.

### Loading + error states
Data fetching components must handle loading AND error states.

### Naming conventions
- Components: PascalCase (`UserCard.tsx`)
- Hooks: `useXxx` (`useAuth.ts`)
- Utils: camelCase or kebab-case

### No deep relative imports
Use `@/` path aliases instead of `../../../`.

### Conventional commits
Format: `type(scope): description`
Types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert

## Architecture

### Effect-first patterns
- Validation: `@effect/schema`
- Logging: `Effect.log`
- Error handling: `Effect.tryPromise`, `Effect.catchAll`
- Services: Effect Layer pattern

### Barrel exports
Export new modules from the directory's `index.ts`.
RULES_EOF
}

# =============================================================================
# Platform Generators
# =============================================================================

generate_claude() {
  local dir="$1"
  if [[ ! -f "$dir/CLAUDE.md" ]]; then
    {
      echo "# VybeKiit Project"
      echo ""
      echo "This project uses VybeKiit conventions with Effect-first patterns."
      echo ""
      echo "## Quick Reference"
      echo "- **Validation**: \`@effect/schema\` (NOT Zod)"
      echo "- **Logging**: \`Effect.log\` (NOT console.log)"
      echo "- **Error handling**: \`Effect.tryPromise\` / \`Effect.catchAll\`"
      echo "- **Commits**: Conventional format (\`feat:\`, \`fix:\`, etc.)"
      echo "- **Max file size**: 300 lines"
      echo "- **Imports**: Use \`@/\` aliases, no deep \`../../../\`"
      echo ""
      echo "## Hooks"
      echo "This project has \`.claude/hooks/\` that enforce these rules automatically."
    } > "$dir/CLAUDE.md"
    echo -e "  ${GREEN}✅${NC} CLAUDE.md"
  else
    echo -e "  ${YELLOW}⏭${NC}  CLAUDE.md (exists)"
  fi
}

generate_kiro() {
  local dir="$1"
  mkdir -p "$dir/.kiro/steering"
  {
    echo "# VybeKiit Project Standards"
    echo ""
    echo "This workspace follows VybeKiit conventions. Apply these rules to all code."
    echo ""
    generate_rules_markdown
  } > "$dir/.kiro/steering/vybekiit.md"
  echo -e "  ${GREEN}✅${NC} .kiro/steering/vybekiit.md"
}

generate_cursor() {
  local dir="$1"
  mkdir -p "$dir/.cursor/rules"
  {
    echo '---'
    echo 'description: "VybeKiit rules — enforced on TypeScript/React/Effect code. Apply when writing components, hooks, services, API routes."'
    echo 'globs: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"]'
    echo 'alwaysApply: false'
    echo '---'
    echo ""
    generate_rules_markdown
  } > "$dir/.cursor/rules/vybekiit.mdc"
  echo -e "  ${GREEN}✅${NC} .cursor/rules/vybekiit.mdc"
}

generate_codex() {
  local dir="$1"
  {
    echo "# VybeKiit Agent Instructions"
    echo ""
    echo "Follow these rules when working in this codebase."
    echo ""
    generate_rules_markdown
  } > "$dir/AGENTS.md"
  echo -e "  ${GREEN}✅${NC} AGENTS.md"
}

generate_gemini() {
  local dir="$1"
  {
    echo "# VybeKiit Project Context"
    echo ""
    echo "Follow these rules for all code generation and modifications."
    echo ""
    generate_rules_markdown
  } > "$dir/GEMINI.md"
  echo -e "  ${GREEN}✅${NC} GEMINI.md"
}

generate_copilot() {
  local dir="$1"
  mkdir -p "$dir/.github"
  {
    echo "# GitHub Copilot Instructions"
    echo ""
    echo "These instructions apply to all Copilot interactions in this repository."
    echo ""
    generate_rules_markdown
  } > "$dir/.github/copilot-instructions.md"
  echo -e "  ${GREEN}✅${NC} .github/copilot-instructions.md"
}

generate_windsurf() {
  local dir="$1"
  {
    echo "# VybeKiit Windsurf Rules"
    echo ""
    echo "Follow these conventions for all code in this workspace."
    echo ""
    generate_rules_markdown
  } > "$dir/.windsurfrules"
  echo -e "  ${GREEN}✅${NC} .windsurfrules"
}

generate_jetbrains() {
  local dir="$1"
  mkdir -p "$dir/.junie"
  {
    echo "# VybeKiit Guidelines"
    echo ""
    echo "Apply these guidelines to all code generation and modifications."
    echo ""
    generate_rules_markdown
  } > "$dir/.junie/guidelines.md"
  echo -e "  ${GREEN}✅${NC} .junie/guidelines.md"
}

generate_cline() {
  local dir="$1"
  mkdir -p "$dir/.clinerules"
  {
    echo "# VybeKiit Project Rules"
    echo ""
    echo "Apply these rules to every task in this project."
    echo ""
    generate_rules_markdown
  } > "$dir/.clinerules/rules.md"
  echo -e "  ${GREEN}✅${NC} .clinerules/rules.md"
}

generate_kilo() {
  local dir="$1"
  mkdir -p "$dir/.kilo/rules"
  {
    echo "# VybeKiit Rules for Kilo Code"
    echo ""
    echo "Apply these conventions to all code in this workspace."
    echo ""
    generate_rules_markdown
  } > "$dir/.kilo/rules/vybekiit.md"
  echo -e "  ${GREEN}✅${NC} .kilo/rules/vybekiit.md"
}

generate_aider() {
  local dir="$1"
  {
    echo "# VybeKiit Coding Conventions"
    echo ""
    echo "Follow these conventions when making changes to this codebase."
    echo ""
    generate_rules_markdown
  } > "$dir/CONVENTIONS.md"
  echo -e "  ${GREEN}✅${NC} CONVENTIONS.md"
}

generate_roo() {
  local dir="$1"
  mkdir -p "$dir/.roo"
  {
    echo "# VybeKiit Rules for Roo Code"
    echo ""
    generate_rules_markdown
  } > "$dir/.roo/rules.md"
  echo -e "  ${GREEN}✅${NC} .roo/rules.md"
}

generate_augment() {
  local dir="$1"
  {
    echo "# VybeKiit Guidelines for Augment"
    echo ""
    echo "Follow these project-specific rules for all code modifications."
    echo ""
    generate_rules_markdown
  } > "$dir/.augment-guidelines"
  echo -e "  ${GREEN}✅${NC} .augment-guidelines"
}

generate_zed() {
  local dir="$1"
  mkdir -p "$dir/.zed"
  {
    echo "# VybeKiit Rules for Zed AI"
    echo ""
    generate_rules_markdown
  } > "$dir/.zed/rules.md"
  echo -e "  ${GREEN}✅${NC} .zed/rules.md"
}

# =============================================================================
# Main
# =============================================================================

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   VybeKiit Multi-Platform Config Generator (14 platforms)  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

TARGET_DIR="${1:-.}"
MODE="${2:---detect}"

# If --check mode, run detection first
if [[ "$MODE" == "--check" ]]; then
  DETECT_SCRIPT="$(dirname "${BASH_SOURCE[0]}")/detect-agents.sh"
  if [[ -f "$DETECT_SCRIPT" ]]; then
    bash "$DETECT_SCRIPT"
    echo ""
    echo -e "  ${YELLOW}Generating configs for detected project platforms...${NC}"
    echo ""
    MODE="--detect"
  fi
fi

if [[ "$MODE" == "--all" ]]; then
  PLATFORMS="$ALL_PLATFORMS"
elif [[ "$MODE" == "--detect" ]]; then
  PLATFORMS=$(detect_platforms "$TARGET_DIR")
  echo -e "  🔍 Detected: ${YELLOW}$PLATFORMS${NC}"
else
  # Accept comma-separated or space-separated
  PLATFORMS=$(echo "$MODE" | tr ',' ' ')
fi

echo ""

for platform in $PLATFORMS; do
  case "$platform" in
    claude)    generate_claude "$TARGET_DIR" ;;
    kiro)      generate_kiro "$TARGET_DIR" ;;
    cursor)    generate_cursor "$TARGET_DIR" ;;
    codex)     generate_codex "$TARGET_DIR" ;;
    gemini)    generate_gemini "$TARGET_DIR" ;;
    copilot)   generate_copilot "$TARGET_DIR" ;;
    windsurf)  generate_windsurf "$TARGET_DIR" ;;
    jetbrains) generate_jetbrains "$TARGET_DIR" ;;
    cline)     generate_cline "$TARGET_DIR" ;;
    kilo)      generate_kilo "$TARGET_DIR" ;;
    aider)     generate_aider "$TARGET_DIR" ;;
    roo)       generate_roo "$TARGET_DIR" ;;
    augment)   generate_augment "$TARGET_DIR" ;;
    zed)       generate_zed "$TARGET_DIR" ;;
    *) echo -e "  ${YELLOW}⚠️${NC}  Unknown: $platform" ;;
  esac
done

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "  Done: ${GREEN}$(echo $PLATFORMS | wc -w | tr -d ' ')${NC} platform config(s) generated"
echo ""
echo "  Detection signals:"
echo "    .claude/ or CLAUDE.md           → Claude Code (hooks ✓)"
echo "    .kiro/                          → Kiro"
echo "    .cursor/ or .cursorrules        → Cursor"
echo "    AGENTS.md or .codex.yaml        → OpenAI Codex"
echo "    GEMINI.md or .gemini/           → Gemini CLI"
echo "    .github/                        → GitHub Copilot"
echo "    .windsurfrules                  → Windsurf"
echo "    .junie/ or .idea/               → JetBrains/Junie"
echo "    .clinerules or .cline/          → Cline (hooks ✓)"
echo "    .kilo/ or kilo.jsonc            → Kilo Code"
echo "    CONVENTIONS.md or .aider.*      → Aider"
echo "    .roo/                           → Roo Code"
echo "    .augment-guidelines or .augment/→ Augment"
echo "    .zed/                           → Zed AI"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
