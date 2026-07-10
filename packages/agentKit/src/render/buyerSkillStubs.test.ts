import {
  AGENT_SKILL_SYMLINKS,
  buyerSkillStemFromPath,
  checkAgentSkillSymlinks,
  checkBuyerSkillStubDrift,
  lookupBuyerSkillTriggerPhrases,
  planAgentSkillSymlinks,
  planBuyerSkillStubOutputs,
  renderBuyerSkillDescription,
  renderBuyerSkillStub,
} from '@vybekiit/agent-kit/render/buyerSkillStubs';
import { describe, expect, it } from 'vitest';

/** Fixture buyer skill body (source shape under `.vybekiit/skills/`). */
const GO_LIVE = `# Skill: go-live

**Goal:** the builder's app is online at a real web address that anyone can open.

## Steps

1. Put the app online.
`;

// "---\nname: go-live\n" -> true
const GO_LIVE_FRONTMATTER_PATTERN = /^---\nname: go-live\n/;

// biome-ignore lint/security/noSecrets: Test title is a public function name, not a credential.
describe('buyerSkillStemFromPath', () => {
  it('parses buyer skill paths', () => {
    expect(buyerSkillStemFromPath('.vybekiit/skills/go-live.md')).toBe('go-live');
  });
});

describe('renderBuyerSkillStub', () => {
  it('includes frontmatter, marker, and full buyer body', () => {
    const stub = renderBuyerSkillStub('go-live', GO_LIVE, 'web');
    expect(stub).toMatch(GO_LIVE_FRONTMATTER_PATTERN);
    expect(stub).toContain('vybekiit:generated:buyer-skill-stub');
    expect(stub).toContain('# Skill: go-live');
    expect(stub).toContain('**Goal:**');
  });

  it('embeds trigger phrases from goal catalog', () => {
    const description = renderBuyerSkillDescription('go-live', 'the builder app is online', 'web');
    expect(description).toContain('put it online');
    expect(lookupBuyerSkillTriggerPhrases('go-live', 'web')).toContain('deploy');
  });
});

describe('checkAgentSkillSymlinks', () => {
  it('passes when symlinks match expected targets', () => {
    const states = Object.fromEntries(
      AGENT_SKILL_SYMLINKS.map(({ link, target }) => [link, { isSymlink: true, target }]),
    );
    expect(checkAgentSkillSymlinks(states).ok).toBe(true);
  });

  it('flags wrong target', () => {
    const report = checkAgentSkillSymlinks({
      '.claude/skills': { isSymlink: true, target: '.agents/skills' },
    });
    expect(report.ok).toBe(false);
    expect(report.issues[0]?.issue).toBe('wrong_target');
  });
});

describe('checkBuyerSkillStubDrift', () => {
  it('passes when stub matches rendered output', () => {
    const buyerPath = '.vybekiit/skills/go-live.md';
    const content = renderBuyerSkillStub('go-live', GO_LIVE, 'web');
    const report = checkBuyerSkillStubDrift(
      'web',
      { [buyerPath]: GO_LIVE },
      { '.agents/skills/go-live/SKILL.md': content },
    );
    expect(report.ok).toBe(true);
  });

  it('flags missing stub', () => {
    const report = checkBuyerSkillStubDrift('web', { '.vybekiit/skills/go-live.md': GO_LIVE }, {});
    expect(report.ok).toBe(false);
    expect(report.issues[0]?.issue).toBe('missing_stub');
  });
});

describe('planBuyerSkillStubOutputs', () => {
  it('plans one output per buyer skill file', () => {
    const outputs = planBuyerSkillStubOutputs('web', {
      '.vybekiit/skills/go-live.md': GO_LIVE,
    });
    expect(outputs).toHaveLength(1);
    expect(outputs[0]?.stubPath).toBe('.agents/skills/go-live/SKILL.md');
  });
});

describe('planAgentSkillSymlinks', () => {
  it('plans creates when symlinks are missing or wrong', () => {
    const plan = planAgentSkillSymlinks({});
    expect(plan.toCreate).toHaveLength(AGENT_SKILL_SYMLINKS.length);
    expect(plan.report.ok).toBe(false);
  });

  it('skips when symlinks already correct', () => {
    const states = Object.fromEntries(
      AGENT_SKILL_SYMLINKS.map(({ link, target }) => [link, { isSymlink: true, target }]),
    );
    const plan = planAgentSkillSymlinks(states);
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.report.ok).toBe(true);
  });
});
