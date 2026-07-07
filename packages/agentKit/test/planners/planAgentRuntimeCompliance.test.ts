import { planAgentRuntimeCompliance } from '@vybekiit/agent-kit/planners/planAgentRuntimeCompliance';
import { describe, expect, it } from 'vitest';

const LIVE_DOCS = {
  'cursor-rules': 'Project rules use .mdc with alwaysApply and AGENTS.md alternative',
  'claude-code-index': 'Read CLAUDE.md at project root',
  'codex-agents-md': 'Codex reads AGENTS.md for project scope',
  'skills-sh': 'Install with npx skills add from skills.sh',
  'copilot-instructions':
    'Place a copilot-instructions.md file in .github to set repo-level instructions',
  'kiro-steering': 'Place markdown files in .kiro/steering to configure agent behavior',
  'windsurf-rules': 'Store project rules in .windsurf/rules for Cascade context',
  'cline-rules': 'Add project-level rules in .clinerules directory',
  'amazonq-rules': 'Project rules live in .amazonq/rules for Amazon Q Developer',
  'continue-rules': 'Define project rules in .continue/rules for IDE assistant',
  'junie-agents': 'Junie reads AGENTS.md and config from .junie folder',
  'gemini-styleguide': 'Configure .gemini directory with a styleguide for Gemini Code Assist',
  'augment-rules': 'Configure .augment/rules and guidelines for Augment Code',
  'roo-rules': 'Custom instructions in .roo/rules for Roo Code',
  'gemini-cli-md': 'Place GEMINI.md at project root for Gemini CLI context',
  'trae-rules': 'Store rules in .trae directory for Trae IDE assistant',
  'antigravity-rules': 'Define .agent/rules for Antigravity code agent',
  'replit-md': 'Place replit.md at project root for Replit agent context',
  'devin-rules': 'AGENTS.md is read by Devin for project rules',
  'opencode-rules': 'AGENTS.md is the entry point for OpenCode rules',
  'zed-instructions': 'AGENTS.md and instructions are used by Zed AI assistant',
};

describe('planAgentRuntimeCompliance', () => {
  it('passes for valid runtime wiring and buyer skill', () => {
    const report = planAgentRuntimeCompliance({
      liveDocs: LIVE_DOCS,
      files: {
        'CLAUDE.md': '# CLAUDE.md\n\nThin pointer — AGENTS.md is SSOT.\n',
        'AGENTS.md': '# AGENTS\n\nSingle source of truth for agents.\n',
        '.cursor/rules/vybekiit.mdc': `---
description: VybeKiit
alwaysApply: true
---

Read AGENTS.md
`,
      },
      skillContents: {
        '.vybekiit/skills/onboarding.md': `# Skill: onboarding

**Goal:** run the app.

**Contract:** plain language.

## Steps

1. Do thing.
`,
      },
      platformSkillContents: {
        '.vybekiit/platform-skills/format-lint-vybekiit.md': '# Format\n\nRun pnpm format.\n',
      },
    });
    expect(report.ok).toBe(true);
  });

  it('flags missing CLAUDE.md pointer', () => {
    const report = planAgentRuntimeCompliance({
      liveDocs: LIVE_DOCS,
      files: {
        'AGENTS.md': 'Single source of truth',
        '.cursor/rules/vybekiit.mdc': `---
alwaysApply: true
---
AGENTS.md
`,
      },
      skillContents: {},
      platformSkillContents: {},
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.check === 'claude-pointer')).toBe(true);
  });

  it('skips live doc checks when liveDocs omitted', () => {
    const report = planAgentRuntimeCompliance({
      files: {
        'CLAUDE.md': 'Thin pointer to AGENTS.md',
        'AGENTS.md': 'Single source of truth',
        '.cursor/rules/vybekiit.mdc': `---
alwaysApply: true
---
AGENTS.md
`,
      },
      skillContents: {},
      platformSkillContents: {},
    });
    expect(report.issues.every((i) => i.check !== 'runtime-docs-live')).toBe(true);
  });
});
