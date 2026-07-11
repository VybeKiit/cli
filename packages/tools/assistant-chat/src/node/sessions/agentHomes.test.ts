import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  resolveAgentStoreRoots,
  resolveClaudeHome,
  resolveCodexHome,
  resolveCursorHome,
  resolveDevinCliDataDirs,
  resolveDevinSessionsDbPaths,
  resolveDevinTranscriptDirs,
  resolveGrokHome,
  resolveKimiHome,
  resolveKiroHome,
} from './agentHomes';

describe('resolveClaudeHome', () => {
  it('defaults to ~/.claude under the user home', () => {
    const home = resolveClaudeHome({});
    expect(home.endsWith(join('.claude'))).toBe(true);
  });

  it('honors CLAUDE_CONFIG_DIR override (all platforms)', () => {
    expect(resolveClaudeHome({ CLAUDE_CONFIG_DIR: '/custom/claude' })).toBe('/custom/claude');
    expect(resolveClaudeHome({ CLAUDE_CONFIG_DIR: '  D:\\ClaudeData  ' })).toBe('D:\\ClaudeData');
  });

  it('ignores blank CLAUDE_CONFIG_DIR', () => {
    const home = resolveClaudeHome({ CLAUDE_CONFIG_DIR: '   ' });
    expect(home.endsWith(join('.claude'))).toBe(true);
  });
});

describe('resolveCodexHome', () => {
  it('defaults to ~/.codex', () => {
    expect(resolveCodexHome({}).endsWith(join('.codex'))).toBe(true);
  });

  it('honors CODEX_HOME', () => {
    expect(resolveCodexHome({ CODEX_HOME: '/opt/codex' })).toBe('/opt/codex');
  });
});

describe('resolveKimiHome', () => {
  it('defaults to ~/.kimi-code', () => {
    expect(resolveKimiHome({}).endsWith(join('.kimi-code'))).toBe(true);
  });

  it('honors KIMI_CODE_HOME', () => {
    expect(resolveKimiHome({ KIMI_CODE_HOME: 'C:\\Users\\me\\.kimi-code' })).toBe(
      'C:\\Users\\me\\.kimi-code',
    );
  });
});

describe('resolveKiroHome', () => {
  it('defaults to ~/.kiro', () => {
    expect(resolveKiroHome({}).endsWith(join('.kiro'))).toBe(true);
  });

  it('honors KIRO_HOME', () => {
    expect(resolveKiroHome({ KIRO_HOME: '/tmp/kiro-profile' })).toBe('/tmp/kiro-profile');
  });
});

describe('resolveGrokHome / resolveCursorHome', () => {
  it('use user-home relative defaults (Windows = %USERPROFILE% via os.homedir)', () => {
    expect(resolveGrokHome({}).endsWith(join('.grok'))).toBe(true);
    expect(resolveCursorHome({}).endsWith(join('.cursor'))).toBe(true);
  });
});

describe('resolveDevinCliDataDirs', () => {
  it('on native Windows prefers APPDATA then LOCALAPPDATA then XDG then Unix layout', () => {
    const dirs = resolveDevinCliDataDirs(
      {
        APPDATA: 'C:\\Users\\me\\AppData\\Roaming',
        LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
        XDG_DATA_HOME: 'C:\\Users\\me\\.local\\share',
      },
      'win32',
    );

    expect(dirs[0]).toBe(join('C:\\Users\\me\\AppData\\Roaming', 'devin', 'cli'));
    expect(dirs[1]).toBe(join('C:\\Users\\me\\AppData\\Local', 'devin', 'cli'));
    expect(dirs[2]).toBe(join('C:\\Users\\me\\.local\\share', 'devin', 'cli'));
    expect(dirs.some((dir) => dir.includes(join('.local', 'share', 'devin', 'cli')))).toBe(true);
  });

  it('on Linux/Ubuntu uses XDG_DATA_HOME when set, then ~/.local/share/devin/cli', () => {
    const dirs = resolveDevinCliDataDirs(
      {
        XDG_DATA_HOME: '/home/ubuntu/.local/share',
        HOME: '/home/ubuntu',
      },
      'linux',
    );

    expect(dirs[0]).toBe(join('/home/ubuntu/.local/share', 'devin', 'cli'));
    // Default home layout still present (may equal XDG when they match — deduped).
    expect(dirs.every((dir) => dir.endsWith(join('devin', 'cli')))).toBe(true);
  });

  it('on macOS without XDG uses ~/.local/share/devin/cli only', () => {
    const dirs = resolveDevinCliDataDirs({}, 'darwin');
    expect(dirs.length).toBeGreaterThanOrEqual(1);
    expect(dirs[0]?.endsWith(join('.local', 'share', 'devin', 'cli'))).toBe(true);
    // No APPDATA-style path when not on Windows.
    expect(dirs.every((dir) => !dir.includes('AppData'))).toBe(true);
  });

  it('maps sessions.db and transcripts under each data dir', () => {
    const dbs = resolveDevinSessionsDbPaths(
      { APPDATA: 'C:\\Users\\me\\AppData\\Roaming' },
      'win32',
    );
    const transcripts = resolveDevinTranscriptDirs(
      { APPDATA: 'C:\\Users\\me\\AppData\\Roaming' },
      'win32',
    );
    expect(dbs[0]).toBe(join('C:\\Users\\me\\AppData\\Roaming', 'devin', 'cli', 'sessions.db'));
    expect(transcripts[0]).toBe(
      join('C:\\Users\\me\\AppData\\Roaming', 'devin', 'cli', 'transcripts'),
    );
  });
});

describe('resolveAgentStoreRoots', () => {
  it('composes official subpaths for every agent under overrides', () => {
    const roots = resolveAgentStoreRoots({
      CLAUDE_CONFIG_DIR: '/cfg/claude',
      CODEX_HOME: '/cfg/codex',
      KIMI_CODE_HOME: '/cfg/kimi',
      KIRO_HOME: '/cfg/kiro',
    });

    expect(roots.claudeProjects).toBe(join('/cfg/claude', 'projects'));
    expect(roots.codexSessions).toBe(join('/cfg/codex', 'sessions'));
    expect(roots.codexSessionIndex).toBe(join('/cfg/codex', 'session_index.jsonl'));
    expect(roots.kimiSessionIndex).toBe(join('/cfg/kimi', 'session_index.jsonl'));
    expect(roots.kiroSessionsCli).toBe(join('/cfg/kiro', 'sessions', 'cli'));
    expect(roots.cursorProjects.endsWith(join('.cursor', 'projects'))).toBe(true);
    expect(roots.grokSessions.endsWith(join('.grok', 'sessions'))).toBe(true);
    expect(roots.devinSessionsDbs.length).toBeGreaterThan(0);
    expect(roots.devinTranscriptDirs.length).toBeGreaterThan(0);
  });
});
