import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { CapabilitiesResponse, ModelsResponse } from '@vybekiit/assistant-chat/capabilities';
import type { VybeAssistant } from '@vybekiit/report-mode';

import {
  CLAUDE_FALLBACK_MODELS,
  CODEX_FALLBACK_MODELS,
  cursorModelsResponse,
  parseAnthropicModels,
  parseCodexConfigModel,
  parseOpenAiModels,
} from './index';

const MODEL_CACHE_MS = 60_000;
const CURSOR_TRACE_ID_ENV = 'CURSOR_TRACE_ID';
const cache = new Map<string, { at: number; value: ModelsResponse }>();

const isInstalled = (command: string): boolean => {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const readTrimmedEnvValue = (env: NodeJS.ProcessEnv, key: string): string | undefined => {
  const value = env[key];

  if (typeof value !== 'string') {
    return;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return;
  }

  return trimmed;
};

const resolveCodexHome = (env: NodeJS.ProcessEnv): string => {
  const configuredHome = readTrimmedEnvValue(env, 'CODEX_HOME');

  if (typeof configuredHome === 'string') {
    return configuredHome;
  }

  return join(homedir(), '.codex');
};

/**
 * Probe which assistant CLIs are available on the local machine.
 *
 * @returns Local assistant capability metadata for the browser panel.
 * @example
 * const capabilities = probeCapabilities();
 */
export const probeCapabilities = (): CapabilitiesResponse => {
  const claudeInstalled = isInstalled('claude');
  const codexInstalled = isInstalled('codex');
  const cursorTraceId = readTrimmedEnvValue(process.env, CURSOR_TRACE_ID_ENV);
  const cursorInstalled = isInstalled('cursor') || typeof cursorTraceId === 'string';

  return {
    assistants: [
      {
        id: 'claude',
        streaming: claudeInstalled,
        modelPicker: claudeInstalled,
        installed: claudeInstalled,
        ...(claudeInstalled ? {} : { reason: 'Install Claude Code CLI' }),
      },
      {
        id: 'codex',
        streaming: codexInstalled,
        modelPicker: codexInstalled,
        installed: codexInstalled,
        ...(codexInstalled ? {} : { reason: 'Install Codex CLI' }),
      },
      {
        id: 'cursor',
        streaming: false,
        modelPicker: false,
        installed: cursorInstalled,
        reason: 'Deeplink-only - opens in Cursor',
      },
    ],
  };
};

const fetchJson = async (url: string, headers: Record<string, string>): Promise<unknown> => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
};

const probeClaudeModels = async (env: NodeJS.ProcessEnv): Promise<ModelsResponse> => {
  const key = readTrimmedEnvValue(env, 'ANTHROPIC_API_KEY');
  if (typeof key === 'string') {
    try {
      const payload = await fetchJson('https://api.anthropic.com/v1/models', {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      });
      return {
        assistant: 'claude',
        models: parseAnthropicModels(payload),
        source: 'live',
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      // fall through to static aliases
    }
  }
  return {
    assistant: 'claude',
    models: CLAUDE_FALLBACK_MODELS,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  };
};

const probeCodexModels = async (env: NodeJS.ProcessEnv): Promise<ModelsResponse> => {
  const models = [...CODEX_FALLBACK_MODELS];
  const configPath = join(resolveCodexHome(env), 'config.toml');
  try {
    const configModel = parseCodexConfigModel(readFileSync(configPath, 'utf8'));
    if (configModel) {
      models.unshift({ id: configModel, label: `${configModel} (config)`, default: true });
    }
  } catch {
    // no local config
  }

  const key = readTrimmedEnvValue(env, 'OPENAI_API_KEY');
  if (typeof key === 'string') {
    try {
      const payload = await fetchJson('https://api.openai.com/v1/models', {
        Authorization: `Bearer ${key}`,
      });
      return {
        assistant: 'codex',
        models: parseOpenAiModels(payload),
        source: 'live',
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      // fall through
    }
  }

  return {
    assistant: 'codex',
    models,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  };
};

/**
 * Probe available models for one assistant.
 *
 * @param assistant - Assistant whose models should be listed.
 * @param env - Environment source used for API keys and local config locations.
 * @returns A cached model response with either live or fallback data.
 * @example
 * const models = await probeModels('codex', process.env);
 */
export const probeModels = async (
  assistant: VybeAssistant,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ModelsResponse> => {
  if (assistant === 'cursor') {
    return {
      ...cursorModelsResponse(),
      fetchedAt: new Date().toISOString(),
    };
  }

  const cacheKey = assistant;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < MODEL_CACHE_MS) {
    return cached.value;
  }

  const value = assistant === 'claude' ? await probeClaudeModels(env) : await probeCodexModels(env);
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
};
