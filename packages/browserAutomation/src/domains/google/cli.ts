import { printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { baseVerbContext } from '@vybekiit/browser-automation/cli/verbContext';
import {
  type GoogleOAuthParams,
  googleEnvBlock,
} from '@vybekiit/browser-automation/domains/google/types';
import {
  runGoogleOAuthSetup,
  standbyGoogleLogin,
} from '@vybekiit/browser-automation/domains/google/verbs/standbyLogin';

/**
 * Parse `google oauth` args into params. Missing required flags are collected in `missing`.
 *
 * @param args - Command-specific CLI arguments.
 * @returns Parsed value for downstream automation.
 * @example
 * const result = parseGoogleOAuthArgs(['--json']);
 */
export const parseGoogleOAuthArgs = (
  args: string[],
): {
  params: Partial<GoogleOAuthParams>;
  missing: string[];
} => {
  const params: Partial<GoogleOAuthParams> = {};
  const redirectUris: string[] = [];
  const jsOrigins: string[] = [];
  const scopes: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('--project=')) params.projectId = arg.slice('--project='.length);
    else if (arg.startsWith('--app-name=')) params.appName = arg.slice('--app-name='.length);
    else if (arg.startsWith('--support-email='))
      params.supportEmail = arg.slice('--support-email='.length);
    else if (arg.startsWith('--app-url=')) params.appUrl = arg.slice('--app-url='.length);
    else if (arg.startsWith('--redirect=')) redirectUris.push(arg.slice('--redirect='.length));
    else if (arg.startsWith('--js-origin=')) jsOrigins.push(arg.slice('--js-origin='.length));
    else if (arg.startsWith('--privacy=')) params.privacyUrl = arg.slice('--privacy='.length);
    else if (arg.startsWith('--terms=')) params.termsUrl = arg.slice('--terms='.length);
    else if (arg.startsWith('--logo=')) params.logoPath = arg.slice('--logo='.length);
    else if (arg.startsWith('--scope=')) scopes.push(arg.slice('--scope='.length));
    else if (arg === '--publish') params.publish = true;
    else if (arg === '--reset-secret') params.resetSecret = true;
  }
  if (redirectUris.length > 0) params.redirectUris = redirectUris;
  if (jsOrigins.length > 0) params.jsOrigins = jsOrigins;
  if (scopes.length > 0) params.scopes = scopes;

  const missing: string[] = [];
  if (!params.projectId) missing.push('project');
  if (!params.appName) missing.push('app-name');
  if (!params.supportEmail) missing.push('support-email');
  if (!params.appUrl) missing.push('app-url');
  if (redirectUris.length === 0) missing.push('redirect');
  return { params, missing };
};

/**
 * Register Google Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerGoogleDomain(registry);
 */
export const registerGoogleDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'google',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Google Cloud Console after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyGoogleLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) printLine(`OK: Cloud Console ready at ${result.url}`);
          else printLine('Timed out waiting for Google sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      oauth: {
        description:
          'Fix Google OAuth redirect_uri_mismatch / Auth.js localhost: idempotent patch of existing Web client redirects + JS origins (no secret churn); creates client if missing. Flags: --project --app-name --support-email --app-url --redirect... [--js-origin=...] [--privacy=url] [--terms=url] [--logo=path] [--scope=...] [--publish] [--reset-secret]',
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
              clientId: result.clientId,
              reusedExisting: result.reusedExisting,
              redirectsApplied: result.redirectsApplied ?? [],
              originsApplied: result.originsApplied ?? [],
              secretRotated: result.clientSecret !== undefined,
            });
          } else {
            printLine(
              result.reusedExisting
                ? 'OK: Google OAuth client patched (redirects + JS origins).'
                : 'OK: Google OAuth client ready.',
            );
            if (result.redirectsApplied !== undefined && result.redirectsApplied.length > 0) {
              printLine(`Redirects: ${result.redirectsApplied.join(', ')}`);
            }
            if (result.originsApplied !== undefined && result.originsApplied.length > 0) {
              printLine(`JS origins: ${result.originsApplied.join(', ')}`);
            }
            printLine('Write these to .env (secret only present after create/--reset-secret):');
            for (const [key, value] of Object.entries(env)) {
              printLine(`${key}=${value}`);
            }
          }
          return 0;
        },
      },
    },
  });
};
