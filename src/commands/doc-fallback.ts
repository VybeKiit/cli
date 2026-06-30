import { planDocFallback } from '@vybekiit/agent-kit';

export function runDocFallback(args: string[]): { json: string; exitCode: number } {
  const techId = args[0];
  if (!techId) {
    return {
      json: JSON.stringify({ error: 'Usage: vybekiit doc-fallback <tech-id>' }),
      exitCode: 1,
    };
  }
  const plan = planDocFallback(techId, args[1]);
  return { json: JSON.stringify(plan, null, 2), exitCode: plan.found ? 0 : 1 };
}
