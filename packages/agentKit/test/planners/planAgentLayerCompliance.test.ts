import { planAgentLayerCompliance } from '@vybekiit/agentKit/planners/planAgentLayerCompliance';
import { describe, expect, it } from 'vitest';

const minimalWebFiles = {
  'checklist.md': `# Production checklist
<!-- vybekiit:generated:start production-gates -->
## Before you go live
- [ ] x
<!-- vybekiit:generated:end production-gates -->
## Decision log
<!-- Agent appends dated entries below — never delete -->
`,
  '.vybekiit/agent/tech-references.md': `<!-- vybekiit:generated:start tech-references -->
x
<!-- vybekiit:generated:end tech-references -->`,
  '.vybekiit/agent/session-bootstrap.md': `<!-- vybekiit:generated:start session-bootstrap -->
x
<!-- vybekiit:generated:end session-bootstrap -->`,
  'language.md': '<!-- vybekiit:generated:start tone -->\n<!-- vybekiit:generated:end tone -->',
  'AGENTS.md':
    '<!-- vybekiit:generated:start contract -->\n<!-- vybekiit:generated:end contract -->',
  'CONTEXT.md': '# CONTEXT.md — your app\n',
};

describe('planAgentLayerCompliance', () => {
  it('passes with minimal valid web layout', () => {
    const skills = ['.vybekiit/skills/onboarding.md'];
    const report = planAgentLayerCompliance({
      template: 'web',
      files: minimalWebFiles,
      skillPaths: skills,
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.check === 'goal-drift')).toBe(true);
  });

  it('flags missing decision log header', () => {
    const report = planAgentLayerCompliance({
      template: 'web',
      files: {
        ...minimalWebFiles,
        'checklist.md': '# Production checklist\n',
      },
      skillPaths: [],
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.check === 'checklist-structure')).toBe(true);
  });

  it('passes platform-skills manifest parity when template extends base', () => {
    const report = planAgentLayerCompliance({
      template: 'web',
      files: minimalWebFiles,
      skillPaths: [],
      platformSkillsManifest: { sources: [] },
    });
    expect(report.issues.some((i) => i.check === 'platform-skills-manifest-parity')).toBe(false);
  });
});
