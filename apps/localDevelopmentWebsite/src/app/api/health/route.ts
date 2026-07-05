import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = () =>
  NextResponse.json({
    ok: true,
    daemon: { port: 3006, protocol: 'ws' },
    timestamp: new Date().toISOString(),
  });
