import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
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

type ComplianceFactory = (config: ComplianceConfigType) => ComplianceService;

const complianceFactories = {
  local: createLocalCompliance,
} satisfies Partial<Record<ComplianceProviderNameType, ComplianceFactory>>;

const complianceErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseComplianceConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, ComplianceError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new ComplianceError({
        code: 'COMPLIANCE_CONFIG_INVALID',
        message: complianceErrorMessage(caught),
      }),
  });

const findComplianceFactory = (
  provider: ComplianceProviderNameType,
): Effect.Effect<ComplianceFactory, ComplianceError> => {
  const createProvider = complianceFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new ComplianceError({
        code: 'COMPLIANCE_PROVIDER_UNSUPPORTED',
        message: `No compliance provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
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
  parseComplianceConfigSlice(ComplianceConfig, source).pipe(
    Effect.flatMap((config) =>
      findComplianceFactory(config.COMPLIANCE_PROVIDER).pipe(
        Effect.map((createProvider) => createProvider(config)),
      ),
    ),
  );

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

/** @deprecated Use {@link createComplianceFromEnv}; kept for existing template imports. */
export const resolveComplianceProvider = createComplianceFromEnv;
