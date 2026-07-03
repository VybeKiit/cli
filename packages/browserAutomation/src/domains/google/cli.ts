import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import {
  type GoogleOAuthParams,
  googleEnvBlock,
} from '@vybekiit/browserAutomation/domains/google/types';
import {
  runGoogleOAuthSetup,
  standbyLogin,
} from '@vybekiit/browserAutomation/domains/google/verbs/standbyLogin';

/** Parse `google oauth` args into params. Missing required flags are collected in `missing`. */
export function parseGoogleOAuthArgs(args: string[]): {
  params: Partial<GoogleOAuthParams>;
  missing: string[];
} {
  const params: Partial<GoogleOAuthParams> = {};
  const redirectUris: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('--project=')) params.projectId = arg.slice('--project='.length);
    else if (arg.startsWith('--app-name=')) params.appName = arg.slice('--app-name='.length);
    else if (arg.startsWith('--support-email='))
      params.supportEmail = arg.slice('--support-email='.length);
    else if (arg.startsWith('--app-url=')) params.appUrl = arg.slice('--app-url='.length);
    else if (arg.startsWith('--redirect=')) redirectUris.push(arg.slice('--redirect='.length));
    else if (arg.startsWith('--privacy=')) params.privacyUrl = arg.slice('--privacy='.length);
    else if (arg.startsWith('--terms=')) params.termsUrl = arg.slice('--terms='.length);
    else if (arg === '--reset-secret') params.resetSecret = true;
  }
  if (redirectUris.length > 0) params.redirectUris = redirectUris;

  const missing: string[] = [];
  if (!params.projectId) missing.push('project');
  if (!params.appName) missing.push('app-name');
  if (!params.supportEmail) missing.push('support-email');
  if (!params.appUrl) missing.push('app-url');
  if (redirectUris.length === 0) missing.push('redirect');
  return { params, missing };
}

export function registerGoogleDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'google',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Google Cloud Console after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: Cloud Console ready at ${result.url}`);
          else console.log('Timed out waiting for Google sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      oauth: {
        description:
          'Configure OAuth consent screen and create Web OAuth client (--project --app-name --support-email --app-url --redirect...)',
        run: async ({ args, flags }) => {
          const { params, missing } = parseGoogleOAuthArgs(args);
          if (missing.length > 0) {
            const hint = missing.map((f) => `--${f}`).join(' ');
            throw new Error(`Missing required flags: ${hint}`);
          }
          const result = await runGoogleOAuthSetup(
            baseVerbContext(flags),
            params as GoogleOAuthParams,
          );
          const env = googleEnvBlock(result);
          if (flags.json) {
            printJson({
              ok: true,
              env,
              projectId: result.projectId,
              reusedExisting: result.reusedExisting,
            });
          } else {
            console.log('OK: Google OAuth client ready.');
            console.log('Write these to .env:');
            for (const [key, value] of Object.entries(env)) {
              console.log(`${key}=${value}`);
            }
          }
          return 0;
        },
      },
    },
  });
}
