import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { VybeAssistant } from '@vybekiit/report-mode';

import type { CapabilitiesResponse, ModelsResponse } from '../../capabilities';
import {
  CLAUDE_FALLBACK_MODELS,
  CODEX_FALLBACK_MODELS,
  cursorModelsResponse,
  parseAnthropicModels,
  parseCodexConfigModel,
  parseOpenAiModels,
} from './index';

const MODEL_CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: ModelsResponse }>();

function isInstalled(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function probeCapabilities(): CapabilitiesResponse {
  const claudeInstalled = isInstalled('claude');
  const codexInstalled = isInstalled('codex');
  const cursorInstalled = isInstalled('cursor') || Boolean(process.env.CURSOR_TRACE_ID);

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
        reason: 'Deeplink-only — opens in Cursor',
      },
    ],
  };
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function probeClaudeModels(env: NodeJS.ProcessEnv): Promise<ModelsResponse> {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (key) {
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
}

async function probeCodexModels(env: NodeJS.ProcessEnv): Promise<ModelsResponse> {
  const models = [...CODEX_FALLBACK_MODELS];
  const configPath = join(env.CODEX_HOME?.trim() || join(homedir(), '.codex'), 'config.toml');
  try {
    const configModel = parseCodexConfigModel(readFileSync(configPath, 'utf8'));
    if (configModel) {
      models.unshift({ id: configModel, label: `${configModel} (config)`, default: true });
    }
  } catch {
    // no local config
  }

  const key = env.OPENAI_API_KEY?.trim();
  if (key) {
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
}

export async function probeModels(
  assistant: VybeAssistant,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ModelsResponse> {
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
}
