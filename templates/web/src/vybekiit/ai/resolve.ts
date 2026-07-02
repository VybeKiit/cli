import {
  aiConfigSchema,
  openaiConfigSchema,
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

/** Registry entries for anthropic/openrouter resolve to local until those adapters ship (ADR-0012). */
export function resolveAiProvider(env: EnvSource = process.env): AiProvider {
  const { AI_PROVIDER } = parseEnv(aiConfigSchema, env);
  return resolveEnvProvider(
    AI_PROVIDER,
    {
      anthropic: () => createLocalAi(),
      openrouter: () => createLocalAi(),
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
