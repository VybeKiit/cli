import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Return local console health metadata.
 *
 * @returns JSON response confirming the daemon protocol and port.
 * @example
 * const response = GET();
 */
export const GET = () =>
  NextResponse.json({
    ok: true,
    daemon: { port: 3006, protocol: 'ws' },
    timestamp: new Date().toISOString(),
  });
