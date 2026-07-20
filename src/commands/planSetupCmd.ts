import { planSetup, type SetupDomain } from '@vybekiit/agent-kit';

const DOMAINS: readonly SetupDomain[] = ['payments', 'auth', 'database', 'deploy', 'email'];

/**
 * Render a plain-language setup checklist for a supported setup domain.
 *
 * @param args - CLI arguments after `plan-setup`; first item must be a setup domain.
 * @returns Plain text output plus the process exit code for the command.
 */
export const runPlanSetup = (
  args: string[],
): { readonly output: string; readonly exitCode: number } => {
  const [domainArg] = args;
  const domain = DOMAINS.find((candidate) => candidate === domainArg);

  if (domain === undefined) {
    return {
      output: `Pass a setup domain: ${DOMAINS.join(', ')}`,
      exitCode: 1,
    };
  }

  const plan = planSetup(domain);
  const lines = [plan.summary, ''];

  for (const step of plan.steps) {
    lines.push(`${step.order}. ${step.builderMessage}`);
    if (step.skill) {
      lines.push(`   Skill: ${step.skill}`);
    }
    if (step.envKeys !== undefined && step.envKeys.length > 0) {
      lines.push(`   Secret settings: ${step.envKeys.join(', ')}`);
    }
    if (step.verify) {
      lines.push(`   Verify: ${step.verify}`);
    }
  }

  return { output: lines.join('\n'), exitCode: 0 };
};
