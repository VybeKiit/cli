import { resolveAssistantChatPort } from '@vybekiit/assistant-chat';
import { startAssistantChatBridge } from '@vybekiit/assistant-chat/node';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BridgeHandle = {
  readonly port: number;
};

declare global {
  // Singleton across Next.js hot reloads in the same Node process.
  // eslint-disable-next-line no-var -- intentional process-wide registry
  var __vybeAssistantChatBridge: BridgeHandle | undefined;
}

/**
 * Probe whether something already answers on the bridge port.
 *
 * @param port - Bridge port to check.
 * @returns True when `/capabilities` responds OK.
 */
const isBridgeReachable = async (port: number): Promise<boolean> => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/capabilities`, {
      method: 'GET',
      signal: AbortSignal.timeout(800),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Dev-only: make sure the assistant chat bridge is listening so the floating
 * panel connects without the vibe coder running a second terminal command.
 *
 * @returns JSON `{ ok, port, alreadyRunning? }` or 404 outside development.
 * @example
 * POST /api/dev/ensure-bridge
 */
export const POST = async (): Promise<Response> => {
  // Ensure-bridge flow (dev only):
  // 1. Reject outside development.
  // 2. If this process already owns the bridge on `port` → alreadyRunning.
  // 3. If something else already answers on `port` → record handle, alreadyRunning.
  // 4. Otherwise start the bridge; on race (port taken mid-start) re-probe and succeed.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, message: 'Dev only.' }, { status: 404 });
  }

  const port = resolveAssistantChatPort(process.env);

  // Step 2 — same Node process hot-reload registry.
  if (globalThis.__vybeAssistantChatBridge?.port === port) {
    return NextResponse.json({ ok: true, port, alreadyRunning: true });
  }

  // Step 3 — another process (or prior boot) already listening.
  if (await isBridgeReachable(port)) {
    globalThis.__vybeAssistantChatBridge = { port };
    return NextResponse.json({ ok: true, port, alreadyRunning: true });
  }

  try {
    // Step 4a — start a new bridge for the configured assistant.
    const assistant = resolveVybeAssistant(process.env) ?? 'claude';
    startAssistantChatBridge({
      port,
      assistant,
      cwd: process.cwd(),
    });
    globalThis.__vybeAssistantChatBridge = { port };
    return NextResponse.json({ ok: true, port, alreadyRunning: false });
  } catch (error) {
    // Step 4b — race: port bound between probe and listen; treat as already running.
    if (await isBridgeReachable(port)) {
      globalThis.__vybeAssistantChatBridge = { port };
      return NextResponse.json({ ok: true, port, alreadyRunning: true });
    }
    const message = error instanceof Error ? error.message : 'Could not start the coding helper.';
    return NextResponse.json({ ok: false, message, port }, { status: 500 });
  }
};

/** Same as POST — browsers can also GET while debugging. */
export const GET = POST;
