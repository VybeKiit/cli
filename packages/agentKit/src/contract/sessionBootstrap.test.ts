import {
  renderAgentSessionBootstrap,
  renderSessionBootstrapFile,
} from '@vybekiit/agent-kit/contract/sessionBootstrap';
import { describe, expect, it } from 'vitest';

describe('renderAgentSessionBootstrap', () => {
  it('documents project skill discovery for Cursor, Claude, and Codex', () => {
    const body = renderAgentSessionBootstrap();
    expect(body).toContain('## Project skill discovery');
    expect(body).toContain('.agents/skills/<goal>/SKILL.md');
    expect(body).toContain('.vybekiit/skills/<goal>.md');
    expect(body).toContain('use-kit-mcp');
    expect(body).toContain('mcp-tools-vybekiit.md');
    expect(body).toContain('goal-index.md');
  });
});

describe('renderSessionBootstrapFile', () => {
  it('wraps bootstrap in generated markers', () => {
    const file = renderSessionBootstrapFile();
    expect(file).toContain('vybekiit:generated:start session-bootstrap');
    expect(file).toContain('vybekiit:generated:end session-bootstrap');
    expect(file).toContain('.agents/skills/<goal>/SKILL.md');
  });
});
