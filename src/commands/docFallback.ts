import { planDocFallback } from '@vybekiit/agent-kit';

/**
 * Render official documentation fallback links for one technology id.
 *
 * @param args - CLI arguments after `doc-fallback`; first item is the tech id.
 * @returns JSON output plus the process exit code for the command.
 * @example
 * const result = runDocFallback(['stripe']);
 */
export const runDocFallback = (
  args: string[],
): { readonly json: string; readonly exitCode: number } => {
  const [techId, packageName] = args;

  if (!techId) {
    return {
      json: JSON.stringify({ error: 'Usage: vybekiit doc-fallback <tech-id>' }),
      exitCode: 1,
    };
  }

  const plan = planDocFallback(techId, packageName);
  return { json: JSON.stringify(plan, null, 2), exitCode: plan.found ? 0 : 1 };
};
