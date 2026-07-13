import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
 * Options for {@link createGithubPagesHost}.
 */
export type CreateGithubPagesHostOptions = {
  readonly mode: LiveWorkMode;
  readonly projectName?: string;
  readonly buildDir?: string;
  readonly cwd?: string;
  readonly env?: EnvSource;
  /** Injectable fetch (GitHub REST + ready-check). */
  readonly fetchImpl?: typeof fetch;
  readonly skipVerify?: boolean;
  /**
   * When set, skip live API and use this result (unit tests).
   */
  readonly createPages?: (input: GithubPagesCreateInput) => Promise<GithubPagesCreateResult>;
};

/**
 * Input to GitHub Pages create (test seam).
 */
export type GithubPagesCreateInput = {
  readonly name: string;
  readonly token: string;
  readonly owner: string;
};

/**
 * Result from GitHub Pages create (test seam).
 */
export type GithubPagesCreateResult = {
  readonly repoFullName: string;
  readonly url: string;
};

/**
 * Read a GitHub token from env (never log the value).
 * Accepts GITHUB_TOKEN or GH_TOKEN (Actions / gh convention).
 *
 * @param env - Raw environment.
 * @returns Token or null.
 * @example
 * readGithubToken({ GITHUB_TOKEN: 'ghp_…' });
 */
export const readGithubToken = (env: EnvSource): string | null => {
  for (const key of ['GITHUB_TOKEN', 'GH_TOKEN'] as const) {
    const value = env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
};

/**
 * Read optional owner override (user or org login).
 *
 * @param env - Raw environment.
 * @returns Owner login or null.
 */
export const readGithubPagesOwner = (env: EnvSource): string | null => {
  const value = env.GITHUB_PAGES_OWNER;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
};

/**
 * Ensure a URL ends with `/` (GitHub Pages html_url is inconsistent).
 *
 * @param url - Base URL from the API.
 * @returns URL with a trailing slash.
 */
const withTrailingSlash = (url: string): string => {
  if (url.endsWith('/')) {
    return url;
  }
  return `${url}/`;
};

type GithubTypedError = Error & {
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
const typedGithubError = (
  code: string,
  hopClass: HostLiveWorkError['hopClass'],
  message: string,
): GithubTypedError => Object.assign(new Error(message), { hopClass, code }) as GithubTypedError;

/**
 * Map GitHub API HTTP failure into hop class.
 *
 * @param status - HTTP status.
 * @param body - Response body text.
 * @param code - Stable code.
 * @returns Typed error.
 */
const mapGithubHttp = (status: number, body: string, code: string): GithubTypedError => {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403) {
    return typedGithubError(
      'github_pages_unauthorized',
      'missing_credentials',
      body || `GitHub HTTP ${status}`,
    );
  }
  if (status === 422 && /name already exists|already exists/i.test(body)) {
    return typedGithubError(
      'github_pages_name_taken',
      'hard_stop',
      body || 'Repository name already exists',
    );
  }
  if (
    status === 429 ||
    /quota|rate limit|secondary rate|abuse|plan|too many|exceeded/.test(lower)
  ) {
    return typedGithubError('github_pages_quota', 'quota', body || `GitHub HTTP ${status}`);
  }
  return typedGithubError(code, 'hard_stop', body || `GitHub HTTP ${status}`);
};

/**
 * Map unknown cause into HostLiveWorkError.
 *
 * @param cause - Thrown value.
 * @returns HostLiveWorkError.
 */
const mapGithubCause = (cause: unknown): HostLiveWorkError => {
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
    const typed = cause as GithubTypedError;
    return new HostLiveWorkError({
      code: typed.code,
      message: typed.message,
      hopClass: typed.hopClass,
      provider: 'github-pages',
    });
  }
  return new HostLiveWorkError({
    code: 'github_pages_create_failed',
    message: cause instanceof Error ? cause.message : 'GitHub Pages create failed',
    hopClass: 'hard_stop',
    provider: 'github-pages',
  });
};

/**
 * Resolve authenticated GitHub login via /user.
 *
 * @param token - PAT or gh token.
 * @param fetchImpl - Injectable fetch.
 * @returns Login string.
 */
export const resolveGithubLogin = async (
  token: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<string> => {
  const response = await fetchImpl('https://api.github.com/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vybekiit-live-work',
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw mapGithubHttp(response.status, text, 'github_pages_user_failed');
  }
  let body: { login?: string };
  try {
    body = JSON.parse(text) as { login?: string };
  } catch {
    throw typedGithubError(
      'github_pages_user_invalid',
      'hard_stop',
      'GitHub /user response was not JSON',
    );
  }
  if (typeof body.login !== 'string' || body.login.length === 0) {
    throw typedGithubError(
      'github_pages_no_login',
      'missing_credentials',
      'GitHub token has no login',
    );
  }
  return body.login;
};

/**
 * Best-effort delete a GitHub repo used for Pages dogfood.
 *
 * @param owner - Repo owner login.
 * @param repo - Repo name.
 * @param token - Auth token (never log).
 * @param fetchImpl - Injectable fetch.
 * @returns Always-succeeding Effect.
 * @example
 * await Effect.runPromise(deleteGithubPagesRepo('me', 'vybekiit-lw-gp-1', token));
 */
export const deleteGithubPagesRepo = (
  owner: string,
  repo: string,
  token: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      await fetchImpl(`https://api.github.com/repos/${owner}/${repo}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'vybekiit-live-work',
        },
      });
    } catch {
      // best-effort teardown
    }
  });

/**
 * Parse "owner/repo" project id used as pin/teardown handle.
 *
 * @param projectId - Full name from provision.
 * @returns Parts or null.
 * @example
 * parseGithubPagesProjectId('YosefHayim/vybekiit-lw-gp-1');
 */
export const parseGithubPagesProjectId = (
  projectId: string,
): { readonly owner: string; readonly repo: string } | null => {
  const parts = projectId.split('/');
  if (parts.length !== 2) {
    return null;
  }
  const [owner, repo] = parts;
  if (
    typeof owner !== 'string' ||
    owner.length === 0 ||
    typeof repo !== 'string' ||
    repo.length === 0
  ) {
    return null;
  }
  return { owner, repo };
};

/**
 * Create a public GitHub repo + enable Pages from main (ADR-0039 host ladder).
 * Missing GITHUB_TOKEN / GH_TOKEN → missing_credentials hop.
 *
 * @param options - Mode, env, optional createPages seam.
 * @returns Effect of provisioned host with github.io URL.
 * @example
 * await Effect.runPromise(createGithubPagesHost({ mode: 'demo', env: { GITHUB_TOKEN: '…' } }));
 */
export const createGithubPagesHost = (
  options: CreateGithubPagesHostOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const token = readGithubToken(env);
    if (token === null && options.createPages === undefined) {
      return yield* Effect.fail(
        new HostLiveWorkError({
          code: 'github_pages_missing_token',
          message: 'GitHub Pages host create needs GITHUB_TOKEN or GH_TOKEN',
          hopClass: 'missing_credentials',
          provider: 'github-pages',
        }),
      );
    }

    const projectName = options.projectName ?? defaultLiveWorkProjectName('vybekiit-lw-gp');
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;

    let buildDir = options.buildDir;
    if (buildDir === undefined || buildDir.length === 0) {
      if (options.mode === 'buyer' && options.createPages === undefined) {
        return yield* Effect.fail(
          new HostLiveWorkError({
            code: 'missing_build_dir',
            message: 'Buyer host create needs a build directory (static assets to publish)',
            hopClass: 'missing_credentials',
            provider: 'github-pages',
          }),
        );
      }
      if (options.createPages === undefined) {
        const parent =
          options.cwd ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-gp-site'));
        mkdirSync(parent, { recursive: true });
        buildDir = writeDemoStaticSite(parent);
      }
    }

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        if (options.createPages !== undefined) {
          const owner = readGithubPagesOwner(env) ?? 'test-owner';
          const created = await options.createPages({
            name: projectName,
            token: token ?? '',
            owner,
          });
          return makeProvisionedHost(
            { provider: 'github-pages', ephemeral },
            { url: created.url, projectId: created.repoFullName },
          );
        }

        if (token === null) {
          throw typedGithubError(
            'github_pages_missing_token',
            'missing_credentials',
            'GITHUB_TOKEN missing',
          );
        }

        if (buildDir === undefined) {
          throw typedGithubError(
            'missing_build_dir',
            'missing_credentials',
            'build directory required',
          );
        }

        const owner = readGithubPagesOwner(env) ?? (await resolveGithubLogin(token, fetchImpl));

        const createRepo = await fetchImpl('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'vybekiit-live-work',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            description: 'VybeKiit Live work GitHub Pages dogfood (safe to delete)',
            private: false,
            auto_init: false,
            has_issues: false,
            has_projects: false,
            has_wiki: false,
          }),
        });
        const createText = await createRepo.text();
        if (!createRepo.ok) {
          throw mapGithubHttp(createRepo.status, createText, 'github_pages_repo_create_failed');
        }

        const indexPath = join(buildDir, 'index.html');
        let indexHtml: string;
        try {
          indexHtml = readFileSync(indexPath, 'utf8');
        } catch {
          throw typedGithubError(
            'github_pages_missing_index',
            'hard_stop',
            'GitHub Pages dogfood needs index.html in the build directory',
          );
        }

        const contentB64 = Buffer.from(indexHtml, 'utf8').toString('base64');
        const putFile = await fetchImpl(
          `https://api.github.com/repos/${owner}/${projectName}/contents/index.html`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'User-Agent': 'vybekiit-live-work',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'chore: live work static site',
              content: contentB64,
              branch: 'main',
            }),
          },
        );
        const putText = await putFile.text();
        if (!putFile.ok) {
          throw mapGithubHttp(putFile.status, putText, 'github_pages_upload_failed');
        }

        // Enable Pages from / on main (legacy source).
        const pagesResponse = await fetchImpl(
          `https://api.github.com/repos/${owner}/${projectName}/pages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'User-Agent': 'vybekiit-live-work',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              build_type: 'legacy',
              source: { branch: 'main', path: '/' },
            }),
          },
        );
        const pagesText = await pagesResponse.text();
        // 201 created; 409 may mean already enabled after content push on some orgs.
        if (!pagesResponse.ok && pagesResponse.status !== 409) {
          throw mapGithubHttp(pagesResponse.status, pagesText, 'github_pages_enable_failed');
        }

        let publicUrl = `https://${owner.toLowerCase()}.github.io/${projectName}/`;
        try {
          if (pagesResponse.ok) {
            const pagesBody = JSON.parse(pagesText) as { html_url?: string };
            if (typeof pagesBody.html_url === 'string' && pagesBody.html_url.length > 0) {
              publicUrl = withTrailingSlash(pagesBody.html_url);
            }
          }
        } catch {
          // keep default github.io URL
        }

        // Wait for Pages build status when available.
        for (let i = 0; i < 30; i += 1) {
          const statusResponse = await fetchImpl(
            `https://api.github.com/repos/${owner}/${projectName}/pages`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'vybekiit-live-work',
              },
            },
          );
          if (statusResponse.ok) {
            const statusText = await statusResponse.text();
            try {
              const statusBody = JSON.parse(statusText) as {
                status?: string;
                html_url?: string;
              };
              if (typeof statusBody.html_url === 'string' && statusBody.html_url.length > 0) {
                publicUrl = withTrailingSlash(statusBody.html_url);
              }
              if (
                statusBody.status === 'built' ||
                statusBody.status === 'ready' ||
                statusBody.status === undefined
              ) {
                // status undefined can mean site object without build pipeline yet
                if (statusBody.status === 'built' || statusBody.status === 'ready') {
                  break;
                }
              }
              if (statusBody.status === 'errored') {
                throw typedGithubError(
                  'github_pages_build_error',
                  'hard_stop',
                  'GitHub Pages build failed',
                );
              }
            } catch (cause) {
              if (typeof cause === 'object' && cause !== null && 'hopClass' in cause) {
                throw cause;
              }
            }
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 3000);
          });
        }

        return makeProvisionedHost(
          { provider: 'github-pages', ephemeral },
          {
            url: publicUrl.replace(/\/$/, '') || publicUrl,
            projectId: `${owner}/${projectName}`,
          },
        );
      },
      catch: (cause) => mapGithubCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      yield* verifyHostUrl(provisioned.url, fetchImpl, {
        attempts: 40,
        delayMs: 3000,
      }).pipe(
        Effect.mapError(
          (error) =>
            new HostLiveWorkError({
              code: error.code,
              message: error.message,
              hopClass: error.hopClass,
              provider: 'github-pages',
            }),
        ),
      );
    }

    return provisioned;
  });
