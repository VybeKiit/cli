import { describe, expect, it } from 'vitest';
import { planAgentRuntimeCompliance } from '../../src/planners/planAgentRuntimeCompliance';

const LIVE_DOCS = {
  'cursor-rules': 'Project rules use .mdc with alwaysApply and AGENTS.md alternative',
  'claude-code-index': 'Read CLAUDE.md at project root',
  'codex-agents-md': 'Codex reads AGENTS.md for project scope',
  'skills-sh': 'Install with npx skills add from skills.sh',
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
