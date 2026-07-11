import { describe, expect, it } from 'vitest';
import { searchSkills, skillLoadCandidates, skillRelativePath } from './skills.js';

describe('searchSkills', () => {
  it('finds payments by natural phrase', () => {
    const page = searchSkills('take money', { template: 'web', limit: 5 });
    expect(page.items.some((item) => item.skillFile === 'setup-payments')).toBe(true);
    expect(page.items[0]?.path).toContain('.vybekiit/skills/');
  });

  it('tolerates typos', () => {
    const page = searchSkills('paymants', { template: 'web' });
    expect(page.items.some((item) => item.id === 'setup-payments')).toBe(true);
  });

  it('paginates', () => {
    const first = searchSkills('', { limit: 3 });
    expect(first.items).toHaveLength(3);
    expect(first.hasMore).toBe(true);
    const second = searchSkills(
      '',
      first.nextCursor === null || first.nextCursor === undefined
        ? { limit: 3 }
        : { limit: 3, cursor: first.nextCursor },
    );
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('maps backend template skill names', () => {
    const page = searchSkills('payments', { template: 'backend' });
    expect(page.items.some((item) => item.skillFile === 'wire-payments')).toBe(true);
  });

  it('indexes the first-party MCP catalog skill', () => {
    const page = searchSkills('mcp tools', { template: 'web', limit: 10 });
    expect(page.items.some((item) => item.id === 'use-kit-mcp')).toBe(true);
    expect(page.items.some((item) => item.path.includes('use-kit-mcp'))).toBe(true);
  });
});

describe('skillRelativePath', () => {
  it('builds buyer, platform, and agents paths', () => {
    expect(skillRelativePath('setup-payments')).toBe('.vybekiit/skills/setup-payments.md');
    expect(skillRelativePath('stripe-vybekiit', 'platform')).toBe(
      '.vybekiit/platform-skills/stripe-vybekiit.md',
    );
    expect(skillRelativePath('use-kit-mcp', 'agents')).toBe('.agents/skills/use-kit-mcp/SKILL.md');
  });
});

describe('skillLoadCandidates', () => {
  it('prefers agents + platform paths for use-kit-mcp', () => {
    const paths = skillLoadCandidates('use-kit-mcp');
    expect(paths[0]).toBe('.agents/skills/use-kit-mcp/SKILL.md');
    expect(paths).toContain('.vybekiit/platform-skills/mcp-tools-vybekiit.md');
  });
});
