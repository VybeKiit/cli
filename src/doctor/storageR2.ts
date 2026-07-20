import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hostingConfigSchema, parseEnv } from '@vybekiit/core';
import { writeEnvKeys } from './env';

export type R2ProvisionResult = {
  readonly ok: boolean;
  readonly message: string;
};

// R2 slug: lowercase, non-[a-z0-9-] -> "-", squeeze repeats, trim edges: "My App!!" -> "my-app"
const R2_BUCKET_UNSAFE_PATTERN = /[^a-z0-9-]/g;
const R2_BUCKET_DASH_RUN_PATTERN = /-+/g;
const R2_BUCKET_EDGE_DASH_PATTERN = /^-|-$/g;

type R2Credentials = {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

/**
 * Sanitize a project name into an R2 bucket-safe slug.
 *
 * @param name - Raw project or package name.
 * @returns R2-safe bucket prefix.
 * @example
 * const bucket = sanitizeBucketName('My App!!');
 */
const sanitizeBucketName = (name: string): string =>
  name
    .toLowerCase()
    .replace(R2_BUCKET_UNSAFE_PATTERN, '-')
    .replace(R2_BUCKET_DASH_RUN_PATTERN, '-')
    .replace(R2_BUCKET_EDGE_DASH_PATTERN, '')
    .slice(0, 40);

/**
 * Read the package name to derive a bucket name.
 *
 * @param cwd - Project directory.
 * @returns Sanitized package name or the VybeKiit default.
 * @example
 * const name = readProjectName(process.cwd());
 */
const readProjectName = (cwd: string): string => {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { name?: string };
    if (pkg.name !== undefined && pkg.name !== '' && pkg.name !== 'my-vybekiit-app') {
      return sanitizeBucketName(pkg.name);
    }
  } catch {
    // fall through
  }
  return 'vybekiit-app';
};

/**
 * Probe a wrangler command.
 *
 * @param args - Wrangler arguments to run.
 * @returns True when wrangler exits successfully.
 * @example
 * const ok = wranglerOk(['whoami']);
 */
const wranglerOk = (args: readonly string[]): boolean =>
  spawnSync('wrangler', [...args], { stdio: 'ignore' }).status === 0;

/**
 * Create a Cloudflare R2 API token for S3-compatible access.
 *
 * @param accountId - Cloudflare account id.
 * @param apiToken - Cloudflare API token with token-creation permissions.
 * @param bucketName - Bucket name the token will access.
 * @returns R2 credentials, or null when token creation fails.
 * @example
 * const token = await createR2ApiToken(accountId, apiToken, bucketName);
 */
const createR2ApiToken = async (
  accountId: string,
  apiToken: string,
  bucketName: string,
): Promise<R2Credentials | null> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `vybekiit-${bucketName}`,
        permissions: {
          objects: { read: true, write: true },
        },
      }),
    },
  );
  if (!response.ok) {
    return null;
  }
  const json = (await response.json()) as {
    success?: boolean;
    result?: { access_key_id?: string; secret_access_key?: string };
  };
  if (!(json.success && json.result?.access_key_id && json.result?.secret_access_key)) {
    return null;
  }
  return {
    accessKeyId: json.result.access_key_id,
    secretAccessKey: json.result.secret_access_key,
  };
};

/**
 * Resolve the bucket name, using an explicit env value when present.
 *
 * @param cwd - Project directory.
 * @param env - Merged doctor environment.
 * @returns Bucket name to verify/create.
 * @example
 * const bucket = resolveBucketName(process.cwd(), process.env);
 */
const resolveBucketName = (cwd: string, env: Record<string, string | undefined>): string => {
  if (env.R2_BUCKET !== undefined && env.R2_BUCKET !== '') {
    return env.R2_BUCKET;
  }
  return `${readProjectName(cwd)}-assets`;
};

/**
 * Resolve existing or newly-created R2 credentials.
 *
 * @param env - Merged doctor environment.
 * @param accountId - Cloudflare account id.
 * @param apiToken - Cloudflare API token.
 * @param bucketName - R2 bucket name.
 * @returns R2 credentials, or null when token creation fails.
 * @example
 * const credentials = await resolveR2Credentials(env, accountId, apiToken, bucketName);
 */
const resolveR2Credentials = async (
  env: Record<string, string | undefined>,
  accountId: string,
  apiToken: string,
  bucketName: string,
): Promise<R2Credentials | null> => {
  if (env.R2_ACCESS_KEY_ID !== undefined && env.R2_SECRET_ACCESS_KEY !== undefined) {
    return {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    };
  }

  return await createR2ApiToken(accountId, apiToken, bucketName);
};

/**
 * Resolve the public R2 URL, using an explicit env value when present.
 *
 * @param env - Merged doctor environment.
 * @param accountId - Cloudflare account id.
 * @param bucketName - R2 bucket name.
 * @returns Public URL stored in `.env`.
 * @example
 * const url = resolveR2PublicUrl(process.env, accountId, bucketName);
 */
const resolveR2PublicUrl = (
  env: Record<string, string | undefined>,
  accountId: string,
  bucketName: string,
): string => {
  if (env.R2_PUBLIC_URL !== undefined && env.R2_PUBLIC_URL !== '') {
    return env.R2_PUBLIC_URL;
  }
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
};

/**
 * Provision Cloudflare R2 for asset storage when the default CF stack is active and
 * storage is not yet configured. Creates the bucket, API token, and writes `.env`.
 *
 * @param cwd - Project directory where env keys may be written.
 * @param env - Environment values used for Cloudflare provisioning.
 * @param log - Logger used for provisioning output.
 * @returns R2 provisioning result.
 */
export const provisionR2Storage = async (
  cwd: string,
  env: Record<string, string | undefined>,
  log: Console,
): Promise<R2ProvisionResult> => {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  if (HOSTING_PROVIDER !== 'cloudflare') {
    return { ok: true, message: 'R2 provisioning skipped - hosting is not Cloudflare.' };
  }

  if (
    env.R2_BUCKET !== undefined &&
    env.R2_ACCESS_KEY_ID !== undefined &&
    env.R2_SECRET_ACCESS_KEY !== undefined &&
    env.R2_PUBLIC_URL !== undefined
  ) {
    return { ok: true, message: 'R2 storage already configured.' };
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  if (!(accountId && apiToken)) {
    return {
      ok: false,
      message: 'Cloudflare account ID and API token are required before R2 can be set up.',
    };
  }

  if (!wranglerOk(['whoami'])) {
    return { ok: false, message: 'wrangler is not signed in - run wrangler login first.' };
  }

  const bucketName = resolveBucketName(cwd, env);
  if (!wranglerOk(['r2', 'bucket', 'list'])) {
    return { ok: false, message: 'Could not list R2 buckets - check wrangler auth.' };
  }

  if (wranglerOk(['r2', 'bucket', 'create', bucketName])) {
    log.log(`[doctor] Created R2 bucket "${bucketName}".`);
  } else {
    const exists = wranglerOk(['r2', 'bucket', 'list']);
    if (!exists) {
      return { ok: false, message: `Could not create R2 bucket "${bucketName}".` };
    }
    log.log(`[doctor] R2 bucket "${bucketName}" already exists or create skipped.`);
  }

  const credentials = await resolveR2Credentials(env, accountId, apiToken, bucketName);
  if (credentials === null) {
    return {
      ok: false,
      message: 'Could not create R2 API token - check Cloudflare API token permissions.',
    };
  }

  const publicUrl = resolveR2PublicUrl(env, accountId, bucketName);

  writeEnvKeys(cwd, {
    STORAGE_PROVIDER: 'r2',
    R2_ACCOUNT_ID: accountId,
    R2_BUCKET: bucketName,
    R2_ACCESS_KEY_ID: credentials.accessKeyId,
    R2_SECRET_ACCESS_KEY: credentials.secretAccessKey,
    R2_PUBLIC_URL: publicUrl,
  });

  return { ok: true, message: `R2 storage ready (bucket: ${bucketName}).` };
};
