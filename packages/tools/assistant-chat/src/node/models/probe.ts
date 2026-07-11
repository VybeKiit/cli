import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CapabilitiesResponse, ModelsResponse } from '@vybekiit/assistant-chat/capabilities';
import type { VybeAssistant } from '@vybekiit/report-mode';

import { resolveCodexHome } from '../sessions/agentHomes';
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
  const cursorInstalled =
    isInstalled('cursor') || isInstalled('agent') || typeof cursorTraceId === 'string';
  const kiroInstalled = isInstalled('kiro-cli') || isInstalled('kiro');
  const kimiInstalled = isInstalled('kimi');
  const grokInstalled = isInstalled('grok');
  const devinInstalled = isInstalled('devin');

  return {
    assistants: [
      {
        id: 'claude',
        streaming: claudeInstalled,
        modelPicker: claudeInstalled,
        installed: claudeInstalled,
        openMode: 'stream',
        ...(claudeInstalled ? {} : { reason: 'Install Claude Code CLI' }),
      },
      {
        id: 'codex',
        streaming: codexInstalled,
        modelPicker: codexInstalled,
        installed: codexInstalled,
        openMode: 'stream',
        ...(codexInstalled ? {} : { reason: 'Install Codex CLI' }),
      },
      {
        id: 'cursor',
        streaming: false,
        modelPicker: false,
        installed: cursorInstalled,
        openMode: 'deeplink',
        reason: cursorInstalled
          ? 'Opens in Cursor via deeplink (or Terminal for resume)'
          : 'Install Cursor CLI',
      },
      {
        id: 'kiro',
        streaming: false,
        modelPicker: false,
        installed: kiroInstalled,
        openMode: 'terminal',
        reason: kiroInstalled ? 'Opens kiro-cli in Terminal' : 'Install Kiro CLI',
      },
      {
        id: 'kimi',
        streaming: kimiInstalled,
        modelPicker: false,
        installed: kimiInstalled,
        openMode: 'stream',
        ...(kimiInstalled ? {} : { reason: 'Install Kimi CLI' }),
      },
      {
        id: 'devin',
        streaming: false,
        modelPicker: false,
        installed: devinInstalled,
        openMode: 'terminal',
        reason: devinInstalled ? 'Opens devin in Terminal' : 'Install Devin CLI',
      },
      {
        id: 'grok',
        streaming: grokInstalled,
        modelPicker: grokInstalled,
        installed: grokInstalled,
        openMode: 'stream',
        ...(grokInstalled ? {} : { reason: 'Install Grok CLI' }),
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

/** Empty model catalog for assistants without a live model list. */
const emptyModelsResponse = (assistant: VybeAssistant): ModelsResponse => ({
  assistant,
  models: [],
  source: 'fallback',
  fetchedAt: new Date().toISOString(),
});

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

  if (assistant !== 'claude' && assistant !== 'codex') {
    return emptyModelsResponse(assistant);
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
