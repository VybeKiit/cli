import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hostingConfigSchema, parseEnv } from '@vybekiit/core';
import type { DoctorLog } from './doctorLog';
import { writeEnvKeys } from './env';

export type R2ProvisionStatus = {
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

type CloudflareR2TokenReply = {
  readonly success?: boolean;
  readonly result?: {
    readonly access_key_id?: string;
    readonly secret_access_key?: string;
  };
};

/** R2-safe bucket prefix from a project or package name. */
const sanitizeBucketName = (packageName: string): string =>
  packageName
    .toLowerCase()
    .replace(R2_BUCKET_UNSAFE_PATTERN, '-')
    .replace(R2_BUCKET_DASH_RUN_PATTERN, '-')
    .replace(R2_BUCKET_EDGE_DASH_PATTERN, '')
    .slice(0, 40);

/** Sanitized package.json name, or the VybeKiit default bucket prefix. */
const readProjectName = (cwd: string): string => {
  try {
    const packageJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      name?: string;
    };
    if (
      packageJson.name !== undefined &&
      packageJson.name !== '' &&
      packageJson.name !== 'my-vybekiit-app'
    ) {
      return sanitizeBucketName(packageJson.name);
    }
  } catch {
    // fall through
  }
  return 'vybekiit-app';
};

/** True when wrangler exits successfully. */
const wranglerOk = (wranglerArgs: readonly string[]): boolean =>
  spawnSync('wrangler', [...wranglerArgs], { stdio: 'ignore' }).status === 0;

/** Cloudflare R2 API token for S3-compatible access, or null on failure. */
const createR2ApiToken = async (
  accountId: string,
  apiToken: string,
  bucketName: string,
): Promise<R2Credentials | null> => {
  const cloudflareReply = await fetch(
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
  if (!cloudflareReply.ok) {
    return null;
  }
  const tokenCreation = (await cloudflareReply.json()) as CloudflareR2TokenReply;
  const tokenFields = tokenCreation.result;
  if (!(tokenCreation.success && tokenFields?.access_key_id && tokenFields.secret_access_key)) {
    return null;
  }
  return {
    accessKeyId: tokenFields.access_key_id,
    secretAccessKey: tokenFields.secret_access_key,
  };
};

/** R2 bucket name from env, or derived from the project package name. */
const r2BucketName = (cwd: string, processEnv: Record<string, string | undefined>): string => {
  if (processEnv.R2_BUCKET !== undefined && processEnv.R2_BUCKET !== '') {
    return processEnv.R2_BUCKET;
  }
  return `${readProjectName(cwd)}-assets`;
};

/** Existing R2 credentials from env, or a newly created API token. */
const r2CredentialsFromEnvOrCreate = async (
  processEnv: Record<string, string | undefined>,
  accountId: string,
  apiToken: string,
  bucketName: string,
): Promise<R2Credentials | null> => {
  if (processEnv.R2_ACCESS_KEY_ID !== undefined && processEnv.R2_SECRET_ACCESS_KEY !== undefined) {
    return {
      accessKeyId: processEnv.R2_ACCESS_KEY_ID,
      secretAccessKey: processEnv.R2_SECRET_ACCESS_KEY,
    };
  }

  return await createR2ApiToken(accountId, apiToken, bucketName);
};

/** Public R2 URL from env, or the account/bucket default endpoint. */
const r2PublicUrl = (
  processEnv: Record<string, string | undefined>,
  accountId: string,
  bucketName: string,
): string => {
  if (processEnv.R2_PUBLIC_URL !== undefined && processEnv.R2_PUBLIC_URL !== '') {
    return processEnv.R2_PUBLIC_URL;
  }
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
};

/**
 * Provision Cloudflare R2 for asset storage when the default CF stack is active and
 * storage is not yet configured. Creates the bucket, API token, and writes `.env`.
 */
export const provisionR2Storage = async (
  cwd: string,
  processEnv: Record<string, string | undefined>,
  log: DoctorLog,
): Promise<R2ProvisionStatus> => {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, processEnv);
  if (HOSTING_PROVIDER !== 'cloudflare') {
    return { ok: true, message: 'R2 provisioning skipped - hosting is not Cloudflare.' };
  }

  if (
    processEnv.R2_BUCKET !== undefined &&
    processEnv.R2_ACCESS_KEY_ID !== undefined &&
    processEnv.R2_SECRET_ACCESS_KEY !== undefined &&
    processEnv.R2_PUBLIC_URL !== undefined
  ) {
    return { ok: true, message: 'R2 storage already configured.' };
  }

  const accountId = processEnv.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = processEnv.CLOUDFLARE_API_TOKEN;
  if (!(accountId && apiToken)) {
    return {
      ok: false,
      message: 'Cloudflare account ID and API token are required before R2 can be set up.',
    };
  }

  if (!wranglerOk(['whoami'])) {
    return { ok: false, message: 'wrangler is not signed in - run wrangler login first.' };
  }

  const bucketName = r2BucketName(cwd, processEnv);
  if (!wranglerOk(['r2', 'bucket', 'list'])) {
    return { ok: false, message: 'Could not list R2 buckets - check wrangler auth.' };
  }

  if (wranglerOk(['r2', 'bucket', 'create', bucketName])) {
    log.log(`[doctor] Created R2 bucket "${bucketName}".`);
  } else {
    const bucketListOk = wranglerOk(['r2', 'bucket', 'list']);
    if (!bucketListOk) {
      return { ok: false, message: `Could not create R2 bucket "${bucketName}".` };
    }
    log.log(`[doctor] R2 bucket "${bucketName}" already exists or create skipped.`);
  }

  const credentials = await r2CredentialsFromEnvOrCreate(
    processEnv,
    accountId,
    apiToken,
    bucketName,
  );
  if (credentials === null) {
    return {
      ok: false,
      message: 'Could not create R2 API token - check Cloudflare API token permissions.',
    };
  }

  const publicUrl = r2PublicUrl(processEnv, accountId, bucketName);

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
