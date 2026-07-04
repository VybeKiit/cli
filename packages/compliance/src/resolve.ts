import process from 'node:process';
import { complianceConfigSchema, type EnvSource, parseEnv } from '@vybekiit/core';
import { createLocalCompliance } from './providers/local';
import type { ComplianceProvider } from './types';

/** Build the default compliance module from env — single adapter until #2 ships. */
export function createComplianceFromEnv(env: EnvSource = process.env): ComplianceProvider {
  return createLocalCompliance(parseEnv(complianceConfigSchema, env));
}

/** @deprecated Use {@link createComplianceFromEnv} — kept for existing template imports. */
export const resolveComplianceProvider = createComplianceFromEnv;
