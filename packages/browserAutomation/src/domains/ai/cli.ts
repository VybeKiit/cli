import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import {
  ANTHROPIC_MODELS_URL,
  OPENAI_MODELS_URL,
} from '@vybekiit/browserAutomation/core/constants';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';

/**
 * AI model providers (OpenAI, Anthropic) — no first-party CLI can mint an API key, so this is
 * the browser-fallback path: the key is created in the provider console and shown once. The
 * builder copies it in via `--api-key`; `setup` verifies it live against the provider's
 * `whoami`-equivalent endpoint, then writes it to `.env`. The value is persisted to disk and
 * never echoed back to the agent transcript.
 */

interface AiProviderSpec {
  domain: string;
  aliases: string[];
  label: string;
  envKey: string;
  verify: (apiKey: string) => Promise<boolean>;
}

async function verifyOpenAi(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(OPENAI_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyAnthropic(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(ANTHROPIC_MODELS_URL, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function registerAiProvider(registry: CommandRegistry, spec: AiProviderSpec): void {
  registry.register({
    name: spec.domain,
    aliases: spec.aliases,
    commands: {
      setup: {
        description: `Verify + persist an ${spec.label} API key to .env (--api-key)`,
        run: async ({ args, flags }) => {
          let apiKey: string | undefined;
          for (const arg of args) {
            if (arg.startsWith('--api-key=')) apiKey = arg.slice('--api-key='.length);
          }
          if (!apiKey) {
            const message = `${spec.label} has no CLI to mint a key. Create one in the console and pass --api-key=<key>.`;
            if (flags.json) printJson({ ok: false, error: message });
            else console.error(message);
            return 1;
          }

          const verified = await spec.verify(apiKey);
          const written = await writeEnvBlock({ [spec.envKey]: apiKey });
          if (flags.json) {
            printJson({ ok: verified, keysWritten: written.keysWritten, verified });
          } else {
            console.log(`OK: ${spec.label} setup complete.`);
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(
              verified
                ? `✓ Key verified against the ${spec.label} API.`
                : '⚠ Key written but live verification failed.',
            );
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
}

export function registerOpenAiDomain(registry: CommandRegistry): void {
  registerAiProvider(registry, {
    domain: 'ai/openai',
    aliases: ['openai'],
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    verify: verifyOpenAi,
  });
}

export function registerAnthropicDomain(registry: CommandRegistry): void {
  registerAiProvider(registry, {
    domain: 'ai/anthropic',
    aliases: ['anthropic'],
    label: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    verify: verifyAnthropic,
  });
}
