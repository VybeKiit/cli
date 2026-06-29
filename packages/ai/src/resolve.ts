import {
  aiConfigSchema,
  anthropicConfigSchema,
  openaiConfigSchema,
  openrouterConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { createLocalAi } from './providers/local';
import { createOpenAiProvider } from './providers/openai';
import type { AiProvider } from './types';

type EnvSource = Record<string, string | undefined>;

function isOpenAiUnconfigured(env: EnvSource): boolean {
  return !env.OPENAI_API_KEY;
}

export function resolveAiProvider(env: EnvSource = process.env): AiProvider {
  const { AI_PROVIDER } = parseEnv(aiConfigSchema, env);
  switch (AI_PROVIDER) {
    case 'anthropic':
      parseEnv(anthropicConfigSchema, env);
      throw new Error('anthropic ai adapter ships in a later step');
    case 'openrouter':
      parseEnv(openrouterConfigSchema, env);
      throw new Error('openrouter ai adapter ships in a later step');
    case 'local':
      return createLocalAi();
    default:
      if (isOpenAiUnconfigured(env)) return createLocalAi();
      return createOpenAiProvider(parseEnv(openaiConfigSchema, env));
  }
}
