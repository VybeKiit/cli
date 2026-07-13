import { describe, expect, it } from 'vitest';
import {
  buildFirstPartyMcpConfig,
  FIRST_PARTY_MCP_PACKAGES,
  FIRST_PARTY_MCP_TOOLS,
  firstPartyMcpBinPath,
  MCP_TOOLS_PLATFORM_SKILL_STEM,
  renderMcpToolsPlatformSkill,
  renderUseKitMcpSkillMd,
  toolsForServer,
  USE_KIT_MCP_SKILL_STEM,
} from './mcpToolsCatalog';

describe('FIRST_PARTY_MCP_PACKAGES', () => {
  it('ships agent-mcp and browser-automation', () => {
    expect(FIRST_PARTY_MCP_PACKAGES).toEqual([
      '@vybekiit/agent-mcp',
      '@vybekiit/browser-automation',
    ]);
  });
});

describe('FIRST_PARTY_MCP_TOOLS', () => {
  it('exposes all tools on the single vybekiit server with unique names', () => {
    const names = FIRST_PARTY_MCP_TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(15);
    expect(toolsForServer('vybekiit')).toContain('search_skills');
    expect(toolsForServer('vybekiit')).toContain('run_automation');
    expect(toolsForServer('vybekiit')).toContain('search_ui_components');
  });
});

describe('firstPartyMcpBinPath / buildFirstPartyMcpConfig', () => {
  it('uses surface-relative bins by default', () => {
    expect(firstPartyMcpBinPath('agentMcp', 'surface')).toBe('../../packages/agentMcp/dist/bin.js');
    const config = buildFirstPartyMcpConfig('surface');
    expect(config.mcpServers.vybekiit.args[0]).toContain('../../packages/agentMcp');
    expect(config.mcpServers.vybekiit.env?.VYBEKIIT_PROJECT_ROOT).toBe('.');
  });

  it('points kit-root layout at packages/ and optional template project root', () => {
    const config = buildFirstPartyMcpConfig('kit-root', { template: 'web' });
    expect(config.mcpServers.vybekiit.args[0]).toBe('packages/agentMcp/dist/bin.js');
    expect(config.mcpServers.vybekiit.env?.VYBEKIIT_PROJECT_ROOT).toBe('templates/web');
    expect(config.mcpServers.vybekiit.env?.VYBEKIIT_UI_CATALOG_PATH).toContain('templates/web/');
    expect(Object.keys(config.mcpServers)).toEqual(['vybekiit']);
  });
});

describe('render skill bodies', () => {
  it('renders platform skill and SKILL.md with stable stems and tool tables', () => {
    const platform = renderMcpToolsPlatformSkill();
    expect(platform).toContain(MCP_TOOLS_PLATFORM_SKILL_STEM);
    expect(platform).toContain('search_skills');
    expect(platform).toContain('run_automation');
    expect(platform).toContain('search_ui_components');

    const skill = renderUseKitMcpSkillMd();
    expect(skill).toContain(`name: ${USE_KIT_MCP_SKILL_STEM}`);
    expect(skill).toContain('Agent-only');
    expect(skill).toContain('search_automations');
  });
});
