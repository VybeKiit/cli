import { readFile } from 'node:fs/promises';
import { type DataProviderName, type EntityInput, planDataModel } from '@vybekiit/agent-kit';
import { caughtMessage } from '@vybekiit/core';

/** Data providers supported by the data-model planner. */
const PROVIDERS: readonly DataProviderName[] = [
  'supabase',
  'neon',
  'firebase',
  'mongodb',
  'aws',
  'local',
];

/**
 * Match a CLI value against known data provider names.
 *
 * Local to this command only — not the package ADR `resolveDataProvider` export.
 *
 * @param value - Candidate provider name.
 * @returns Data provider name when supported, otherwise undefined.
 * @example
 * const provider = knownDataProvider('supabase');
 */
const knownDataProvider = (value: string): DataProviderName | undefined =>
  PROVIDERS.find((provider) => provider === value);

/**
 * Plan a data model from an entities JSON file.
 *
 * @param args - CLI arguments after `plan-data-model`; file path then optional provider.
 * @returns JSON plan output plus the process exit code.
 */
export const runPlanDataModel = async (
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const [inputPath, providerInput] = args;

  if (inputPath === undefined || inputPath === '') {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Pass a JSON file path with { entities: EntityInput[] }',
      }),
      exitCode: 1,
    };
  }

  const providerArg =
    providerInput === undefined || providerInput === '' ? 'supabase' : providerInput;
  const provider = knownDataProvider(providerArg);

  if (provider === undefined) {
    return {
      json: JSON.stringify({ ok: false, error: `Unsupported data provider: ${providerArg}` }),
      exitCode: 1,
    };
  }

  try {
    const raw = await readFile(inputPath, 'utf8');
    const parsed = JSON.parse(raw) as { entities?: EntityInput[] };
    const { entities } = parsed;

    if (entities === undefined || entities.length === 0) {
      return {
        json: JSON.stringify({ ok: false, error: 'No entities in input file.' }),
        exitCode: 1,
      };
    }

    const plan = planDataModel(entities, provider);
    return {
      json: JSON.stringify({ ok: true, plan }, null, 2),
      exitCode: 0,
    };
  } catch (error) {
    return {
      json: JSON.stringify({
        ok: false,
        error: caughtMessage(error, 'Failed to read input.'),
      }),
      exitCode: 1,
    };
  }
};
