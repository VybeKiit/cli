import {
  AGENT_LAYER_PATHS,
  formatAgentLayerSyncSummary,
  isAgentLayerExtensionPath,
  planAgentLayerSync,
} from '@vybekiit/agent-kit/planners/agentLayerSync';
import { describe, expect, it } from 'vitest';

// "Refreshing" -> true
const REFRESHING_SUMMARY_PATTERN = /Refreshing/;

describe('AGENT_LAYER_PATHS', () => {
  it('includes core agent layer files', () => {
    expect(AGENT_LAYER_PATHS).toContain('.vybekiit');
    expect(AGENT_LAYER_PATHS).toContain('AGENTS.md');
    expect(AGENT_LAYER_PATHS).toContain('language.md');
    expect(AGENT_LAYER_PATHS).not.toContain('BUILDER-VOICE.md');
    expect(AGENT_LAYER_PATHS).toContain('checklist.md');
    expect(AGENT_LAYER_PATHS).toContain('.cursor/rules/patterns.mdc');
    expect(AGENT_LAYER_PATHS).not.toContain('src');
  });
});

describe('isAgentLayerExtensionPath', () => {
  it('matches buyer-owned extension paths', () => {
    expect(isAgentLayerExtensionPath('.vybekiit/extensions/skills/foo.md')).toBe(true);
    expect(isAgentLayerExtensionPath('.vybekiit/skills/onboarding.md')).toBe(false);
  });
});

describe('planAgentLayerSync', () => {
  it('lists mirror paths that intersect the allowlist', () => {
    const plan = planAgentLayerSync(['AGENTS.md', 'language.md', 'src']);
    expect(plan.pathsToSync).toEqual(['AGENTS.md', 'language.md']);
    expect(plan.upToDate).toBe(false);
  });

  it('reports up to date when mirror has no allowlisted paths', () => {
    const plan = planAgentLayerSync(['src', 'package.json']);
    expect(plan.upToDate).toBe(true);
  });
});

describe('formatAgentLayerSyncSummary', () => {
  it('uses plain language', () => {
    expect(formatAgentLayerSyncSummary({ pathsToSync: ['AGENTS.md'], upToDate: false })).toMatch(
      REFRESHING_SUMMARY_PATTERN,
    );
  });
});
