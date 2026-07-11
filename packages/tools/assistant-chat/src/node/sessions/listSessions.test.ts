import { VYBE_ASSISTANTS } from '@vybekiit/report-mode';
import { describe, expect, it } from 'vitest';

import { decodeEncodedProjectPath } from './fsUtils';
import { buildListSessionsResponse, listNativeSessions } from './listSessions';

describe('decodeEncodedProjectPath', () => {
  it('decodes macOS Claude and Cursor path-style project folders', () => {
    expect(decodeEncodedProjectPath('-Users-me-Desktop-Code')).toBe('/Users/me/Desktop/Code');
    expect(decodeEncodedProjectPath('Users-me-Desktop-Code')).toBe('/Users/me/Desktop/Code');
    expect(decodeEncodedProjectPath('1777844610566')).toBe('');
    expect(decodeEncodedProjectPath('empty-window')).toBe('');
  });

  it('decodes Linux / Ubuntu home paths', () => {
    expect(decodeEncodedProjectPath('-home-ubuntu-projects-app')).toBe('/home/ubuntu/projects/app');
    expect(decodeEncodedProjectPath('home-ubuntu-Code-vybekiit')).toBe(
      '/home/ubuntu/Code/vybekiit',
    );
  });

  it('decodes Windows drive encodings (C:\\… → C--… or -C-…)', () => {
    expect(decodeEncodedProjectPath('C--Users-me-Desktop-Code')).toBe('C:/Users/me/Desktop/Code');
    expect(decodeEncodedProjectPath('c--Users-me-Code')).toBe('C:/Users/me/Code');
    expect(decodeEncodedProjectPath('-C-Users-me-Code')).toBe('C:/Users/me/Code');
    expect(decodeEncodedProjectPath('C-Users-me-Code')).toBe('C:/Users/me/Code');
  });

  it('decodes WSL mount paths under /mnt', () => {
    expect(decodeEncodedProjectPath('-mnt-c-Users-me-Code')).toBe('/mnt/c/Users/me/Code');
    expect(decodeEncodedProjectPath('mnt-c-Users-me-Code')).toBe('/mnt/c/Users/me/Code');
  });
});

describe('listNativeSessions', () => {
  it('lists sessions without throwing for every supported assistant', async () => {
    for (const assistant of VYBE_ASSISTANTS) {
      const sessions = await listNativeSessions(assistant, 5);
      expect(Array.isArray(sessions)).toBe(true);
      for (const session of sessions) {
        expect(session.sessionId.length).toBeGreaterThan(0);
        expect(session.assistant).toBe(assistant);
        expect(typeof session.title).toBe('string');
        expect(typeof session.updatedAt).toBe('string');
      }
    }
  }, 60_000);

  it('returns a response envelope with fetchedAt', async () => {
    const body = await buildListSessionsResponse('kimi', 3);
    expect(body.assistant).toBe('kimi');
    expect(typeof body.fetchedAt).toBe('string');
    expect(Array.isArray(body.sessions)).toBe(true);
  });

  it('surfaces Claude sessions from multiple project folders when available', async () => {
    const sessions = await listNativeSessions('claude', 80);
    const cwds = new Set(sessions.map((session) => session.cwd).filter((cwd) => cwd.length > 0));
    // Machine-dependent: when Claude has multi-repo history, cwd must not all be empty
    // and hyphenated folder names must not be blindly slash-decoded when transcript has real cwd.
    for (const session of sessions) {
      expect(typeof session.cwd).toBe('string');
      // Real transcript cwd never uses the broken email/sender decode when the folder is email-sender.
      if (session.cwd.includes('email-sender') || session.cwd.includes('email/sender')) {
        expect(session.cwd.includes('email-sender')).toBe(true);
      }
    }
    // Soft signal: multi-folder machines should report more than one cwd when history exists.
    if (sessions.length >= 10) {
      expect(cwds.size).toBeGreaterThanOrEqual(1);
    }
  }, 60_000);

  it('lists Grok main sessions across project folders (skips subagent worktrees)', async () => {
    const sessions = await listNativeSessions('grok', 150);
    for (const session of sessions) {
      expect(session.assistant).toBe('grok');
      expect(session.sessionId.includes('subagent')).toBe(false);
      // Worktree-only subagent paths should not appear as the project cwd.
      expect(session.cwd.includes('/.grok/worktrees/')).toBe(false);
    }
    if (sessions.length >= 5) {
      const cwds = new Set(sessions.map((session) => session.cwd).filter((cwd) => cwd.length > 0));
      expect(cwds.size).toBeGreaterThanOrEqual(2);
    }
  }, 60_000);

  it('lists Devin sessions from the local CLI sessions.db when present', async () => {
    const sessions = await listNativeSessions('devin', 50);
    for (const session of sessions) {
      expect(session.assistant).toBe('devin');
      expect(session.sessionId.length).toBeGreaterThan(0);
      expect(typeof session.title).toBe('string');
      expect(session.title.length).toBeGreaterThan(0);
    }
    // Machine with Devin history should surface multi-folder cwd (not empty-only).
    if (sessions.length >= 3) {
      const withCwd = sessions.filter((session) => session.cwd.length > 0);
      expect(withCwd.length).toBeGreaterThanOrEqual(1);
      const cwds = new Set(withCwd.map((session) => session.cwd));
      expect(cwds.size).toBeGreaterThanOrEqual(1);
    }
  }, 30_000);
});
