import { buildLlmsFullDocument } from '@/data/discoverability/llmsFull';

/**
 * Generate `/llms-full.txt` dense fact sheet for answer engines.
 *
 * @returns Plain-text Markdown documentation.
 * @example
 * const response = await GET();
 */
export const GET = async () => {
  const body = buildLlmsFullDocument();

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
