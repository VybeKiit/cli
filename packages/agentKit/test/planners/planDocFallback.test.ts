import { describe, expect, it } from 'vitest';
import { planDocFallback, formatBuilderStuckMessage } from '../../src/planners/planDocFallback';

describe('planDocFallback', () => {
  it('returns twilio docs and MCP url', () => {
    const plan = planDocFallback('twilio');
    expect(plan.found).toBe(true);
    expect(plan.docsUrl).toContain('twilio.com');
    expect(plan.mcpDocsUrl).toContain('mcp.twilio.com');
  });

  it('returns builder stuck message', () => {
    expect(formatBuilderStuckMessage()).toContain('official setup guide');
  });

  it('handles unknown tech id', () => {
    const plan = planDocFallback('unknown-xyz');
    expect(plan.found).toBe(false);
  });
});
