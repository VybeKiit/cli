import {
  aiConfigSchema,
  anthropicConfigSchema,
  openaiConfigSchema,
  openrouterConfigSchema,
  parseEnv,
  resolveEnvProvider,
  type EnvSource,
} from '@vybekiit/core';
import { createLocalAi } from './providers/local';
import { createOpenAiProvider } from './providers/openai';
import type { AiProvider } from './types';

function isOpenAiUnconfigured(env: EnvSource): boolean {
  return !env.OPENAI_API_KEY;
}

export function resolveAiProvider(env: EnvSource = process.env): AiProvider {
  const { AI_PROVIDER } = parseEnv(aiConfigSchema, env);
  return resolveEnvProvider(
    AI_PROVIDER,
    {
      anthropic: (source) => {
        parseEnv(anthropicConfigSchema, source);
        throw new Error('anthropic ai adapter ships in a later step');
      },
      openrouter: (source) => {
        parseEnv(openrouterConfigSchema, source);
        throw new Error('openrouter ai adapter ships in a later step');
      },
      local: () => createLocalAi(),
      openai: (source) => {
        if (isOpenAiUnconfigured(source)) return createLocalAi();
        return createOpenAiProvider(parseEnv(openaiConfigSchema, source));
      },
    },
    env,
    'openai',
  );
}
