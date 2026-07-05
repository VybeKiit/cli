import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { NextResponse } from 'next/server';

const KIRO_SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');

export interface KiroMessage {
  role: string;
  content: string;
  timestamp?: string | undefined;
}

export interface KiroSessionDetail {
  session_id: string;
  title: string;
  cwd: string;
  messages: KiroMessage[];
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a single session by ID. Currently supports Kiro sessions.
 * Returns messages hydrated from the filesystem JSON.
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  try {
    const raw = await readFile(join(KIRO_SESSIONS_DIR, `${id}.json`), 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;

    const messages: KiroMessage[] = [];
    if (Array.isArray(data.messages)) {
      for (const m of data.messages as Array<Record<string, unknown>>) {
        const km: KiroMessage = {
          role: String(m.role ?? 'agent'),
          content: String(m.content ?? ''),
        };
        if (m.timestamp) {
          km.timestamp = String(m.timestamp);
        }
        messages.push(km);
      }
    }

    const detail: KiroSessionDetail = {
      session_id: String(data.session_id ?? id),
      title: String(data.title ?? '(untitled)').slice(0, 120),
      cwd: String(data.cwd ?? ''),
      messages,
      created_at: String(data.created_at ?? ''),
      updated_at: String(data.updated_at ?? ''),
    };

    return NextResponse.json(detail);
  } catch (_err) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
};
