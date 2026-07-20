import { access } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { type FeatureName, planFeatureReadiness, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detectTemplate';
import { inferProjectSurfaceSync } from '../lib/inferProjectSurface';
import { isTemplateName } from '../lib/scaffold';

const FEATURES: readonly FeatureName[] = [
  'sign-in',
  'payments',
  'save-data',
  'deploy',
  'email',
  'file-upload',
];

/**
 * Resolve a feature name from CLI input.
 *
 * @param value - Candidate feature name.
 * @returns Feature name when supported, otherwise undefined.
 * @example
 * const feature = resolveFeatureName('payments');
 */
const resolveFeatureName = (value: string): FeatureName | undefined =>
  FEATURES.find((feature) => feature === value);

/**
 * Check whether a path exists on disk.
 *
 * @param path - Absolute path to probe.
 * @returns True when the path is accessible.
 * @example
 * const exists = await pathExists('/tmp/app/backend/package.json');
 */
const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Plan readiness tasks for a feature and template.
 *
 * @param args - CLI arguments after `plan-readiness`; feature then optional template.
 * @param cwd - Project directory used for template detection.
 * @returns JSON readiness plan plus the process exit code.
 */
export const runPlanReadiness = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const [featureArg, templateArg] = args;
  const feature = featureArg === undefined ? undefined : resolveFeatureName(featureArg);

  if (feature === undefined) {
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
  } else if (templateArg !== undefined && templateArg !== '' && isTemplateName(templateArg)) {
    template = templateArg;
  } else {
    template = await detectTemplateName(cwd);
  }

  if (template === null) {
    return {
      json: JSON.stringify({ ok: false, error: 'Could not detect template.' }),
      exitCode: 1,
    };
  }

  const hasBackend = await pathExists(join(cwd, 'backend', 'package.json'));
  const hasWeb = inferProjectSurfaceSync(cwd).template === 'web';

  const plan = planFeatureReadiness({
    template,
    feature,
    hasBackend,
    hasWeb,
  });

  return {
    json: JSON.stringify({ ok: true, plan }, null, 2),
    exitCode: 0,
  };
};
