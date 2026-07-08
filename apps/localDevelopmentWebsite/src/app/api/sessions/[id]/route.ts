import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

const KIRO_SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');

/** Message row loaded from a Kiro session file. */
export type KiroMessage = {
  readonly role: string;
  readonly content: string;
  readonly timestamp?: string | undefined;
};

/** Hydrated Kiro session response returned by the session detail route. */
export type KiroSessionDetail = {
  readonly session_id: string;
  readonly title: string;
  readonly cwd: string;
  readonly messages: KiroMessage[];
  readonly created_at: string;
  readonly updated_at: string;
};

const valueText = (data: Record<string, unknown>, key: string, defaultValue: string): string => {
  const value = data[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return String(value);
};

/**
 * Fetch a single session by ID. Currently supports Kiro sessions.
 * Returns messages hydrated from the filesystem JSON.
 *
 * @param _request - Incoming Next.js request.
 * @param context - Route params containing the session id.
 * @returns JSON response with the hydrated Kiro session detail.
 * @example
 * const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) });
 */
export const GET = async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  try {
    const raw = await readFile(join(KIRO_SESSIONS_DIR, `${id}.json`), 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;

    const messages: KiroMessage[] = [];
    if (Array.isArray(data.messages)) {
      for (const m of data.messages as Array<Record<string, unknown>>) {
        const message: KiroMessage = {
          role: valueText(m, 'role', 'agent'),
          content: valueText(m, 'content', ''),
          ...(m.timestamp ? { timestamp: String(m.timestamp) } : {}),
        };
        messages.push(message);
      }
    }

    const detail: KiroSessionDetail = {
      session_id: valueText(data, 'session_id', id),
      title: valueText(data, 'title', '(untitled)').slice(0, 120),
      cwd: valueText(data, 'cwd', ''),
      messages,
      created_at: valueText(data, 'created_at', ''),
      updated_at: valueText(data, 'updated_at', ''),
    };

    return NextResponse.json(detail);
  } catch (_err) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
};
