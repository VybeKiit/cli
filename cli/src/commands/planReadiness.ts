import { access } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { planFeatureReadiness, type FeatureName, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';
import { inferProjectSurfaceSync } from '../lib/infer-project-surface';
import { isTemplateName } from '../lib/scaffold';

const FEATURES: readonly FeatureName[] = [
  'sign-in',
  'payments',
  'save-data',
  'deploy',
  'email',
  'file-upload',
];

function isFeatureName(value: string): value is FeatureName {
  return (FEATURES as readonly string[]).includes(value);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runPlanReadiness(
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const [featureArg, templateArg] = args;

  if (!(featureArg && isFeatureName(featureArg))) {
    return {
      json: JSON.stringify({
        ok: false,
        error: `Pass a feature: ${FEATURES.join(', ')}`,
      }),
      exitCode: 1,
    };
  }

  let template: TemplateId | null = null;
  if (templateArg === 'backend') {
    template = 'backend';
  } else if (templateArg && isTemplateName(templateArg)) {
    template = templateArg;
  } else {
    template = await detectTemplateName(cwd);
  }

  if (!template) {
    return {
      json: JSON.stringify({ ok: false, error: 'Could not detect template.' }),
      exitCode: 1,
    };
  }

  const hasBackend = await pathExists(join(cwd, 'backend', 'package.json'));
  const hasWeb = inferProjectSurfaceSync(cwd).template === 'web';

  const plan = planFeatureReadiness({
    template,
    feature: featureArg,
    hasBackend,
    hasWeb,
  });

  return {
    json: JSON.stringify({ ok: true, plan }, null, 2),
    exitCode: 0,
  };
}
