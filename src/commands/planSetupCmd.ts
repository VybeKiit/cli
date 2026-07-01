import process from 'node:process';
import { planSetup, type SetupDomain } from '@vybekiit/agent-kit';

const DOMAINS: readonly SetupDomain[] = ['payments', 'auth', 'database', 'deploy', 'email'];

function isSetupDomain(value: string): value is SetupDomain {
  return (DOMAINS as readonly string[]).includes(value);
}

export async function runPlanSetup(
  args: string[],
): Promise<{ readonly output: string; readonly exitCode: number }> {
  const domain = args[0];

  if (!(domain && isSetupDomain(domain))) {
    return {
      output: `Pass a setup domain: ${DOMAINS.join(', ')}`,
      exitCode: 1,
    };
  }

  const plan = planSetup(domain);
  const lines = [plan.summary, ''];

  for (const step of plan.steps) {
    lines.push(`${step.order}. ${step.builderMessage}`);
    if (step.skill) lines.push(`   Skill: ${step.skill}`);
    if (step.envKeys?.length) lines.push(`   Secret settings: ${step.envKeys.join(', ')}`);
    if (step.verify) lines.push(`   Verify: ${step.verify}`);
  }

  return { output: lines.join('\n'), exitCode: 0 };
}
