import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import {
  defaultLiveWorkProjectName,
  verifyHostUrl,
  writeDemoStaticSite,
} from './cloudflareProvision';
import {
  HostLiveWorkError,
  type LiveWorkMode,
  makeProvisionedHost,
  type ProvisionedHost,
} from './types';

/**
 * Options for {@link createNetlifyHost}.
 */
export type CreateNetlifyHostOptions = {
  readonly mode: LiveWorkMode;
  readonly projectName?: string;
  readonly buildDir?: string;
  readonly cwd?: string;
  readonly env?: EnvSource;
  /** Injectable fetch (Netlify REST API + ready-check). */
  readonly fetchImpl?: typeof fetch;
  readonly skipVerify?: boolean;
  /**
   * When set, skip live API and use this result (unit tests).
   */
  readonly createSite?: (input: NetlifyCreateSiteInput) => Promise<NetlifyCreateSiteResult>;
};

/**
 * Input to Netlify site create (test seam).
 */
export type NetlifyCreateSiteInput = {
  readonly name: string;
  readonly token: string;
};

/**
 * Result from Netlify create (test seam).
 */
export type NetlifyCreateSiteResult = {
  readonly siteId: string;
  readonly url: string;
};

/**
 * Read Netlify personal access token from env (never log the value).
 *
 * @param env - Raw environment.
 * @returns Token or null.
 * @example
 * readNetlifyAuthToken({ NETLIFY_AUTH_TOKEN: 'nfp_…' });
 */
export const readNetlifyAuthToken = (env: EnvSource): string | null => {
  const value = env.NETLIFY_AUTH_TOKEN;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
};

/**
 * First non-empty string among candidates (API field pick without nested ternaries).
 *
 * @param candidates - Values in priority order.
 * @returns First usable string, or null.
 * @example
 * firstNonEmptyString(undefined, 'https://a.netlify.app') === 'https://a.netlify.app';
 */
export const firstNonEmptyString = (...candidates: readonly unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
};

/**
 * Collect static files under a build dir as web paths → raw bytes.
 *
 * @param buildDir - Directory of static assets.
 * @returns Map of "/index.html" style paths to file contents.
 * @example
 * const files = collectStaticFiles('/tmp/site');
 */
export const collectStaticFiles = (buildDir: string): ReadonlyMap<string, Buffer> => {
  const out = new Map<string, Buffer>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!st.isFile()) {
        continue;
      }
      const rel = relative(buildDir, full).split('\\').join('/');
      const webPath = rel.startsWith('/') ? rel : `/${rel}`;
      out.set(webPath, readFileSync(full));
    }
  };
  walk(buildDir);
  return out;
};

/**
 * SHA1 hex digest of file bytes (Netlify file-digest deploy).
 *
 * @param bytes - File contents.
 * @returns Lowercase hex sha1.
 * @example
 * sha1Hex(Buffer.from('hi')) // "c22b5f9…"
 */
export const sha1Hex = (bytes: Buffer): string => createHash('sha1').update(bytes).digest('hex');

type NetlifyTypedError = Error & {
  readonly hopClass: HostLiveWorkError['hopClass'];
  readonly code: string;
};

/**
 * Attach hop class metadata to a thrown Error.
 *
 * @param code - Stable error code.
 * @param hopClass - Hop classification.
 * @param message - API message.
 * @returns Typed error.
 */
const typedNetlifyError = (
  code: string,
  hopClass: HostLiveWorkError['hopClass'],
  message: string,
): NetlifyTypedError => Object.assign(new Error(message), { hopClass, code }) as NetlifyTypedError;

/**
 * Map Netlify API HTTP failure into hop class.
 *
 * @param status - HTTP status.
 * @param body - Response body text.
 * @param code - Stable code prefix.
 * @returns Typed error.
 */
const mapNetlifyHttp = (status: number, body: string, code: string): NetlifyTypedError => {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403) {
    return typedNetlifyError(
      'netlify_unauthorized',
      'missing_credentials',
      body || `Netlify HTTP ${status}`,
    );
  }
  if (status === 429 || status === 402 || /quota|limit|plan|too many|exceeded/.test(lower)) {
    return typedNetlifyError('netlify_quota', 'quota', body || `Netlify HTTP ${status}`);
  }
  return typedNetlifyError(code, 'hard_stop', body || `Netlify HTTP ${status}`);
};

/**
 * Map unknown cause into HostLiveWorkError.
 *
 * @param cause - Thrown value.
 * @returns HostLiveWorkError.
 */
const mapNetlifyCause = (cause: unknown): HostLiveWorkError => {
  if (cause instanceof HostLiveWorkError) {
    return cause;
  }
  if (
    typeof cause === 'object' &&
    cause !== null &&
    'hopClass' in cause &&
    'code' in cause &&
    cause instanceof Error
  ) {
    const typed = cause as NetlifyTypedError;
    return new HostLiveWorkError({
      code: typed.code,
      message: typed.message,
      hopClass: typed.hopClass,
      provider: 'netlify',
    });
  }
  return new HostLiveWorkError({
    code: 'netlify_create_failed',
    message: cause instanceof Error ? cause.message : 'Netlify create failed',
    hopClass: 'hard_stop',
    provider: 'netlify',
  });
};

/**
 * Best-effort delete a Netlify site (demo/dogfood teardown).
 *
 * @param siteId - Netlify site id.
 * @param token - Auth token (never log).
 * @param fetchImpl - Injectable fetch.
 * @returns Always-succeeding Effect.
 * @example
 * await Effect.runPromise(deleteNetlifySite('abc', token));
 */
export const deleteNetlifySite = (
  siteId: string,
  token: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      await fetchImpl(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch {
      // best-effort teardown
    }
  });

/**
 * Create a Netlify site via REST file-digest deploy (ADR-0039 host ladder).
 * Missing NETLIFY_AUTH_TOKEN → missing_credentials hop.
 *
 * @param options - Mode, env, optional createSite seam.
 * @returns Effect of provisioned host with public URL.
 * @example
 * await Effect.runPromise(createNetlifyHost({ mode: 'demo', env: { NETLIFY_AUTH_TOKEN: '…' } }));
 */
export const createNetlifyHost = (
  options: CreateNetlifyHostOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const token = readNetlifyAuthToken(env);
    if (token === null && options.createSite === undefined) {
      return yield* Effect.fail(
        new HostLiveWorkError({
          code: 'netlify_missing_token',
          message: 'Netlify host create needs NETLIFY_AUTH_TOKEN (or connect tools)',
          hopClass: 'missing_credentials',
          provider: 'netlify',
        }),
      );
    }

    const projectName = options.projectName ?? defaultLiveWorkProjectName('vybekiit-lw-nl');
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;

    let buildDir = options.buildDir;
    if (buildDir === undefined || buildDir.length === 0) {
      if (options.mode === 'buyer' && options.createSite === undefined) {
        return yield* Effect.fail(
          new HostLiveWorkError({
            code: 'missing_build_dir',
            message: 'Buyer host create needs a build directory (static assets to publish)',
            hopClass: 'missing_credentials',
            provider: 'netlify',
          }),
        );
      }
      if (options.createSite === undefined) {
        const parent =
          options.cwd ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-nl-site'));
        mkdirSync(parent, { recursive: true });
        buildDir = writeDemoStaticSite(parent);
      }
    }

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        if (options.createSite !== undefined) {
          const created = await options.createSite({
            name: projectName,
            token: token ?? '',
          });
          return makeProvisionedHost(
            { provider: 'netlify', ephemeral },
            { url: created.url, projectId: created.siteId },
          );
        }

        if (token === null) {
          throw typedNetlifyError(
            'netlify_missing_token',
            'missing_credentials',
            'NETLIFY_AUTH_TOKEN missing',
          );
        }

        if (buildDir === undefined) {
          throw typedNetlifyError(
            'missing_build_dir',
            'missing_credentials',
            'build directory required',
          );
        }

        const files = collectStaticFiles(buildDir);
        if (files.size === 0) {
          throw typedNetlifyError(
            'netlify_empty_build',
            'hard_stop',
            'Netlify deploy needs at least one static file',
          );
        }

        const createResponse = await fetchImpl('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: projectName }),
        });
        const createText = await createResponse.text();
        if (!createResponse.ok) {
          throw mapNetlifyHttp(createResponse.status, createText, 'netlify_create_failed');
        }

        let createBody: {
          id?: string;
          ssl_url?: string;
          url?: string;
          site_id?: string;
        };
        try {
          createBody = JSON.parse(createText) as typeof createBody;
        } catch {
          throw typedNetlifyError(
            'netlify_create_invalid',
            'hard_stop',
            'Netlify create response was not JSON',
          );
        }

        const siteId = firstNonEmptyString(createBody.id, createBody.site_id);
        if (siteId === null) {
          throw typedNetlifyError(
            'netlify_create_no_id',
            'hard_stop',
            'Netlify create finished without a site id',
          );
        }

        const fileHashes: Record<string, string> = {};
        const byHash = new Map<string, { readonly path: string; readonly bytes: Buffer }>();
        for (const [path, bytes] of files) {
          const hash = sha1Hex(bytes);
          fileHashes[path] = hash;
          byHash.set(hash, { path, bytes });
        }

        const deployResponse = await fetchImpl(
          `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: fileHashes }),
          },
        );
        const deployText = await deployResponse.text();
        if (!deployResponse.ok) {
          throw mapNetlifyHttp(deployResponse.status, deployText, 'netlify_deploy_failed');
        }

        let deployBody: {
          id?: string;
          required?: readonly string[];
          ssl_url?: string;
          url?: string;
          state?: string;
        };
        try {
          deployBody = JSON.parse(deployText) as typeof deployBody;
        } catch {
          throw typedNetlifyError(
            'netlify_deploy_invalid',
            'hard_stop',
            'Netlify deploy response was not JSON',
          );
        }

        const deployId = deployBody.id;
        if (typeof deployId !== 'string' || deployId.length === 0) {
          throw typedNetlifyError(
            'netlify_deploy_no_id',
            'hard_stop',
            'Netlify deploy finished without a deploy id',
          );
        }

        // `required` is a list of sha1 digests still needed; PUT uses the web path.
        const required = Array.isArray(deployBody.required) ? deployBody.required : [];
        for (const hash of required) {
          const entry = byHash.get(hash);
          if (entry === undefined) {
            throw typedNetlifyError(
              'netlify_missing_file_hash',
              'hard_stop',
              `Netlify required unknown file hash ${hash}`,
            );
          }
          // "/index.html" → "index.html" for the deploy files endpoint
          const uploadPath = entry.path.replace(/^\//, '');
          const putResponse = await fetchImpl(
            `https://api.netlify.com/api/v1/deploys/${deployId}/files/${encodeURIComponent(uploadPath)}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/octet-stream',
              },
              body: new Uint8Array(entry.bytes),
            },
          );
          if (!putResponse.ok) {
            const putText = await putResponse.text();
            throw mapNetlifyHttp(putResponse.status, putText, 'netlify_upload_failed');
          }
        }

        // Poll deploy until ready (or use create-time URL for ssl_url).
        let publicUrl =
          firstNonEmptyString(
            deployBody.ssl_url,
            deployBody.url,
            createBody.ssl_url,
            createBody.url,
          ) ?? `https://${projectName}.netlify.app`;

        for (let i = 0; i < 24; i += 1) {
          const poll = await fetchImpl(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          if (poll.ok) {
            const pollText = await poll.text();
            try {
              const pollBody = JSON.parse(pollText) as {
                state?: string;
                ssl_url?: string;
                url?: string;
              };
              if (typeof pollBody.ssl_url === 'string' && pollBody.ssl_url.length > 0) {
                publicUrl = pollBody.ssl_url;
              } else if (typeof pollBody.url === 'string' && pollBody.url.length > 0) {
                publicUrl = pollBody.url;
              }
              if (pollBody.state === 'ready' || pollBody.state === 'current') {
                break;
              }
              if (pollBody.state === 'error' || pollBody.state === 'failed') {
                throw typedNetlifyError(
                  'netlify_deploy_error',
                  'hard_stop',
                  `Netlify deploy state ${pollBody.state}`,
                );
              }
            } catch (cause) {
              if (typeof cause === 'object' && cause !== null && 'hopClass' in cause) {
                throw cause;
              }
            }
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });
        }

        try {
          publicUrl = new URL(publicUrl).origin;
        } catch {
          // keep as-is
        }

        return makeProvisionedHost(
          { provider: 'netlify', ephemeral },
          { url: publicUrl, projectId: siteId },
        );
      },
      catch: (cause) => mapNetlifyCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      yield* verifyHostUrl(provisioned.url, fetchImpl, {
        attempts: 24,
        delayMs: 2500,
      }).pipe(
        Effect.mapError(
          (error) =>
            new HostLiveWorkError({
              code: error.code,
              message: error.message,
              hopClass: error.hopClass,
              provider: 'netlify',
            }),
        ),
      );
    }

    return provisioned;
  });
