import { getJobs } from '@/lib/providers';
import { Effect } from 'effect';
import { NextResponse } from 'next/server';

/**
 * Handle the Cloudflare Cron entry for queued background jobs.
 *
 * @param _request - Incoming cron request.
 * @param context - Route params containing the job name.
 * @returns JSON response with the queued job id or a job error.
 * @example
 * const response = await GET(request, { params: Promise.resolve({ job: 'sync' }) });
 */
export const GET = async (
  _request: Request,
  context: { params: Promise<{ job: string }> },
): Promise<NextResponse> => {
  const { job } = await context.params;
  const jobs = getJobs();
  return Effect.runPromise(
    jobs.enqueue({ name: job, data: { source: 'cron' } }).pipe(
      Effect.match({
        onFailure: (error) => NextResponse.json({ error: error.message }, { status: 500 }),
        onSuccess: (result) => NextResponse.json({ ok: true, id: result.id }),
      }),
    ),
  );
};
