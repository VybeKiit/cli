import process from 'node:process';
import { type EnvSource, resolveProviderEffect } from '@vybekiit/core';
import { Context, Effect, Layer } from 'effect';
import {
  ComplianceConfig,
  type ComplianceConfigType,
  type ComplianceProviderNameType,
} from './config';
import { createLocalCompliance } from './providers/local';
import { ComplianceError, type ComplianceProvider, type ComplianceService } from './types';

/** Injectable compliance service tag used by composition roots and tests. */
export class Compliance extends Context.Tag('@vybekiit/compliance/Compliance')<
  Compliance,
  ComplianceService
>() {}

const complianceFactories: Partial<
  Record<
    ComplianceProviderNameType,
    (source: EnvSource, config: ComplianceConfigType) => ComplianceService
  >
> = {
  local: (_source, config) => createLocalCompliance(config),
};

/**
 * Resolve the configured compliance service from environment values.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @returns An Effect that succeeds with the configured compliance service or fails with ComplianceError.
 * @example
 * const compliance = await Effect.runPromise(resolveComplianceService({ COOKIE_CONSENT_ENABLED: 'on' }));
 */
export const resolveComplianceService = (
  source: EnvSource = process.env,
): Effect.Effect<ComplianceService, ComplianceError> =>
  resolveProviderEffect({
    source,
    configSchema: ComplianceConfig,
    providerKey: 'COMPLIANCE_PROVIDER',
    factories: complianceFactories,
    toError: (input) =>
      new ComplianceError({
        code:
          input.code === 'PROVIDER_UNSUPPORTED'
            ? 'COMPLIANCE_PROVIDER_UNSUPPORTED'
            : 'COMPLIANCE_CONFIG_INVALID',
        message: input.message,
      }),
  });

/**
 * Build the configured Compliance Layer from environment values.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @returns A Layer that provides Compliance or fails with ComplianceError during construction.
 * @example
 * const layer = makeComplianceLive({ COOKIE_CONSENT_ENABLED: 'on' });
 */
export const makeComplianceLive = (
  source: EnvSource = process.env,
): Layer.Layer<Compliance, ComplianceError> =>
  Layer.effect(Compliance, resolveComplianceService(source));

/**
 * Resolve the current compliance service into the deprecated provider shape.
 *
 * @param source - Environment object to parse, usually `process.env` in templates.
 * @returns Sync compliance provider kept while templates migrate to Effect.
 * @example
 * const compliance = createComplianceFromEnv({ COOKIE_CONSENT_ENABLED: 'on' });
 */
export const createComplianceFromEnv = (source: EnvSource = process.env): ComplianceProvider =>
  Effect.runSync(resolveComplianceService(source));
