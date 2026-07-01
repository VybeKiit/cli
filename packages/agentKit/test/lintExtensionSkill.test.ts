import { describe, expect, it } from 'vitest';
import {
  AGENT_LAYER_EXTENSION_PREFIX,
  isAgentLayerExtensionPath,
} from '../src/planners/agentLayerSync';
import { lintExtensionSkill } from '../src/lint/lintExtensionSkill';
import {
  renderBuyerGoalExtensionSkill,
  renderPlatformWrapperExtensionSkill,
  renderGlobalAgentSkill,
} from '../src/render/extensionSkillTemplates';
import {
  extractExtensionGoalIndexRows,
  formatExtensionGoalIndexRow,
  mergeGoalIndexOnSync,
} from '../src/planners/mergeGoalIndex';
import { detectAgentTool, resolveGlobalSkillPath } from '../src/catalogs/toolSkillPaths';

const VALID_BUYER = renderBuyerGoalExtensionSkill({
  goalStem: 'referral-program',
  goalText: 'users can invite friends and earn rewards.',
  steps: ['**Ask what reward means in plain words.**', '**Wire the invite flow.**'],
  definitionOfDone: 'Referral links work end-to-end with a passing test.',
});

const VALID_WRAPPER = renderPlatformWrapperExtensionSkill({
  techStem: 'planetscale',
  techLabel: 'PlanetScale',
  docsUrl: 'https://planetscale.com/docs',
  kitWiring: [
    'Set `DATA_PROVIDER=planetscale` when adapter ships.',
    'Use `resolveDataProvider()` in app code.',
  ],
  verifySteps: ['Database ping succeeds', 'Smoke test passes'],
  upstreamSkillsRepo: 'planetscale/skills',
});

describe('isAgentLayerExtensionPath', () => {
  it('matches extension prefix', () => {
    expect(isAgentLayerExtensionPath('.vybekiit/extensions/skills/foo.md')).toBe(true);
    expect(isAgentLayerExtensionPath(AGENT_LAYER_EXTENSION_PREFIX)).toBe(true);
    expect(isAgentLayerExtensionPath('.vybekiit/skills/onboarding.md')).toBe(false);
  });
});

describe('lintExtensionSkill', () => {
  it('accepts valid buyer goal draft', () => {
    const report = lintExtensionSkill({ kind: 'buyer-goal', content: VALID_BUYER });
    expect(report.ok).toBe(true);
  });

  it('rejects buyer goal missing Steps', () => {
    const report = lintExtensionSkill({
      kind: 'buyer-goal',
      content: '**Goal:** x\n**Contract:** one action at a time',
    });
    expect(report.ok).toBe(false);
  });

  it('accepts valid platform wrapper', () => {
    const report = lintExtensionSkill({ kind: 'platform-wrapper', content: VALID_WRAPPER });
    expect(report.ok).toBe(true);
  });

  it('accepts valid global agent skill', () => {
    const content = renderGlobalAgentSkill(
      'planetscale',
      'Use PlanetScale for data.',
      VALID_WRAPPER,
    );
    const report = lintExtensionSkill({ kind: 'agent-skills-global', content });
    expect(report.ok).toBe(true);
  });
});

describe('mergeGoalIndexOnSync', () => {
  const synced = `| "go live" | \`skills/go-live.md\` |`;

  it('preserves extension rows from buyer copy', () => {
    const buyer = `${synced}\n| "referrals" | \`extensions/skills/referral-program.md\` |`;
    const merged = mergeGoalIndexOnSync(synced, buyer);
    expect(merged).toContain('extensions/skills/referral-program.md');
    expect(merged).toContain('go-live');
  });

  it('extracts extension rows only', () => {
    const rows = extractExtensionGoalIndexRows(
      '| "x" | `extensions/skills/a.md` |\n| "y" | `skills/b.md` |',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('extensions/skills/a.md');
  });
});

describe('formatExtensionGoalIndexRow', () => {
  it('formats table row', () => {
    expect(formatExtensionGoalIndexRow('refer a friend', 'referral-program')).toContain(
      'referral-program',
    );
  });
});

describe('tool-skill-paths', () => {
  it('detects cursor from project files', () => {
    expect(detectAgentTool({ '.cursor/rules/vybekiit.mdc': true })).toBe('cursor');
  });

  it('resolves global path', () => {
    expect(resolveGlobalSkillPath('cursor', 'my-skill')).toContain('skills-cursor/my-skill');
  });
});
