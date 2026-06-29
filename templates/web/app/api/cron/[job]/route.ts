import { getJobs } from '@/lib/jobs-client';
import { NextResponse } from 'next/server';

/** Cloudflare Cron entry — skill: go-live wires CF cron to this route */
export async function GET(
  _request: Request,
  context: { params: Promise<{ job: string }> },
): Promise<NextResponse> {
  const { job } = await context.params;
  const jobs = getJobs();
  const result = await jobs.enqueue({ name: job, data: { source: 'cron' } });
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.value.id });
}
