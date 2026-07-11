import { describe, expect, it } from 'vitest';
import { detectInstalledAgents } from './detectInstalled';
import { AGENT_IDS } from './registry';
import { listAgentSessions } from './sessionReaders';

describe('detectInstalledAgents', () => {
  it('returns every registered agent with a boolean installed flag', async () => {
    const agents = await detectInstalledAgents();
    expect(agents.map((a) => a.id).sort()).toEqual([...AGENT_IDS].sort());
    for (const agent of agents) {
      expect(typeof agent.installed).toBe('boolean');
      if (agent.installed) {
        expect(agent.resolvedCommand).toBeTruthy();
      }
    }
  });
});

describe('listAgentSessions', () => {
  it('lists sessions without throwing for every agent', async () => {
    for (const id of AGENT_IDS) {
      const sessions = await listAgentSessions(id, null, 5);
      expect(Array.isArray(sessions)).toBe(true);
      for (const session of sessions) {
        expect(session.session_id.length).toBeGreaterThan(0);
        expect(typeof session.title).toBe('string');
      }
    }
  }, 60_000);
});
