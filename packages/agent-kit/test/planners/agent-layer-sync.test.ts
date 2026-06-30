import { describe, expect, it } from 'vitest';
import {
  AGENT_LAYER_PATHS,
  formatAgentLayerSyncSummary,
  planAgentLayerSync,
} from '../../src/planners/agent-layer-sync';

describe('AGENT_LAYER_PATHS', () => {
  it('includes core agent layer files', () => {
    expect(AGENT_LAYER_PATHS).toContain('.vybekiit');
    expect(AGENT_LAYER_PATHS).toContain('AGENTS.md');
    expect(AGENT_LAYER_PATHS).toContain('BUILDER-VOICE.md');
    expect(AGENT_LAYER_PATHS).toContain('checklist.md');
    expect(AGENT_LAYER_PATHS).toContain('.cursor/rules/patterns.mdc');
    expect(AGENT_LAYER_PATHS).not.toContain('src');
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
      /Refreshing/,
    );
  });
});
