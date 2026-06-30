import { complianceConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createLocalCompliance } from './providers/local';
import type { ComplianceProvider } from './types';

export function resolveComplianceProvider(env: EnvSource = process.env): ComplianceProvider {
  return createLocalCompliance(parseEnv(complianceConfigSchema, env));
}
