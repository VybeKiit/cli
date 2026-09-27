import { Effect, Schema } from 'effect';
import { beforeEach, expect, it, vi } from 'vitest';
import { runGlobalInstall } from './runGlobalInstall';

const installation = vi.hoisted(() => ({
  firstSession: vi.fn(),
  saveCompletion: vi.fn(),
}));

vi.mock('./agentGuidance', () => ({
  AgentInstallationSettings: Schema.Unknown,
  agentInstallationTargets: () => [{ agent: 'claude', detected: true }],
  installAgentGuidance: () =>
    Effect.succeed([{ agent: 'claude', status: 'restart-required', collisions: [] }]),
}));
vi.mock('./cliVersion', () => ({ readCliVersion: async () => '0.7.26' }));
vi.mock('./installState', () => ({
  readInstallState: async () => null,
  writeInstallState: installation.saveCompletion,
}));
vi.mock('./installGlobalSkills', () => ({
  installGlobalSkills: async () => ({ installed: ['onboarding'], skipped: [], path: '/skills' }),
}));
vi.mock('./installGlobalMcp', () => ({
  installGlobalMcp: async () => ({
    enabled: ['vybekiit'],
    refreshed: [],
    needsKey: [],
    failed: [],
    claudeMissing: false,
  }),
  isVybekiitMcpReady: () => true,
}));
vi.mock('./awareness', () => ({ installAwareness: async () => ({ commandWritten: true }) }));
vi.mock('./globalStatus', () => ({
  readGlobalStatus: async () => ({ skillCount: 1, skillSample: ['onboarding'] }),
  isGloballyInstalled: () => true,
}));
vi.mock('./runSessionOne', () => ({
  runSessionOne: installation.firstSession,
  shouldSkipSessionOne: () => false,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
});

it.each([
  'depsInstalled',
  'packagesBuilt',
  'projectToolsReady',
  'previewReady',
])('does not stamp setup complete when %s failed', async (failedStage) => {
  installation.firstSession.mockResolvedValue({
    appPath: '/app',
    created: true,
    depsInstalled: true,
    packagesBuilt: true,
    projectToolsReady: true,
    previewReady: true,
    browserOpened: true,
    lines: [],
    [failedStage]: false,
  });
  const exitCode = await runGlobalInstall(['--yes'], async () => ({
    entitled: true,
    reason: 'entitled',
    login: 'buyer',
  }));
  expect(exitCode).toBe(1);
  expect(installation.saveCompletion).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
