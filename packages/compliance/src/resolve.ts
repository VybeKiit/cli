import { complianceConfigSchema, parseEnv } from '@vybekiit/core';
import { createLocalCompliance } from './providers/local';
import type { ComplianceProvider } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveComplianceProvider(env: EnvSource = process.env): ComplianceProvider {
  return createLocalCompliance(parseEnv(complianceConfigSchema, env));
}
