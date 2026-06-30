import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { planDataModel, type DataProviderName, type EntityInput } from '@vybekiit/agent-kit';

const PROVIDERS: readonly DataProviderName[] = [
  'supabase',
  'neon',
  'firebase',
  'mongodb',
  'aws',
  'local',
];

function isProvider(value: string): value is DataProviderName {
  return (PROVIDERS as readonly string[]).includes(value);
}

export async function runPlanDataModel(
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const inputPath = args[0];
  const providerArg = args[1] ?? 'supabase';

  if (!inputPath) {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Pass a JSON file path with { entities: EntityInput[] }',
      }),
      exitCode: 1,
    };
  }

  const provider = isProvider(providerArg) ? providerArg : 'supabase';

  try {
    const raw = await readFile(inputPath, 'utf8');
    const parsed = JSON.parse(raw) as { entities?: EntityInput[] };
    const entities = parsed.entities ?? [];

    if (entities.length === 0) {
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
        error: error instanceof Error ? error.message : 'Failed to read input.',
      }),
      exitCode: 1,
    };
  }
}
