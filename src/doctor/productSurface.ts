/**
 * Plain-language hints for the expanded product-surface packages (ADR-0012).
 * Does not import maintained packages — env-only checks the agent can translate.
 */
export function formatProductSurfaceHints(
  env: Record<string, string | undefined>,
): readonly string[] {
  const lines: string[] = [];

  if (env.JOBS_PROVIDER === 'cloudflare' && !env.CLOUDFLARE_QUEUE_NAME) {
    lines.push(
      '[doctor] background jobs: add CLOUDFLARE_QUEUE_NAME (or use local jobs until go-live)',
    );
  }
  if (env.KV_PROVIDER === 'cloudflare' && !env.CLOUDFLARE_KV_NAMESPACE_ID) {
    lines.push('[doctor] fast storage: add CLOUDFLARE_KV_NAMESPACE_ID for Cloudflare KV');
  }
  if (env.ANALYTICS_PROVIDER === 'plausible' && !env.PLAUSIBLE_DOMAIN) {
    lines.push('[doctor] visitor stats: add PLAUSIBLE_DOMAIN (or analytics stays local no-op)');
  }
  if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    lines.push(
      '[doctor] AI features: add OPENAI_API_KEY (or AI stays local mock until you add keys)',
    );
  }
  if (env.NOTIFICATIONS_PROVIDER === 'expo') {
    lines.push(
      '[doctor] push notifications: Expo push works; email channel needs setup-email first',
    );
  }

  if (lines.length === 0) {
    lines.push(
      '[doctor] product surface packages: env looks ready (analytics, jobs, kv, AI, notifications)',
    );
  }
  return lines;
}
