import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeEnvKeys } from './env';

export interface R2ProvisionResult {
  readonly ok: boolean;
  readonly message: string;
}

function sanitizeBucketName(name: string): string {
  // R2 slug: lowercase, non-[a-z0-9-] → "-", squeeze repeats, trim edges: "My App!!" → "my-app"
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function readProjectName(cwd: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { name?: string };
    if (pkg.name && pkg.name !== 'my-vybekiit-app') {
      return sanitizeBucketName(pkg.name);
    }
  } catch {
    // fall through
  }
  return 'vybekiit-app';
}

function wranglerOk(args: readonly string[]): boolean {
  return spawnSync('wrangler', [...args], { stdio: 'ignore' }).status === 0;
}

async function createR2ApiToken(
  accountId: string,
  apiToken: string,
  bucketName: string,
): Promise<{ accessKeyId: string; secretAccessKey: string } | null> {
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
}

/**
 * Provision Cloudflare R2 for asset storage when the default CF stack is active and
 * storage is not yet configured. Creates the bucket, API token, and writes `.env`.
 */
export async function provisionR2Storage(
  cwd: string,
  env: Record<string, string | undefined>,
  log: Console,
): Promise<R2ProvisionResult> {
  const hosting = env.HOSTING_PROVIDER ?? 'cloudflare';
  if (hosting !== 'cloudflare') {
    return { ok: true, message: 'R2 provisioning skipped — hosting is not Cloudflare.' };
  }

  if (env.R2_BUCKET && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_PUBLIC_URL) {
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
    return { ok: false, message: 'wrangler is not signed in — run wrangler login first.' };
  }

  const bucketName = env.R2_BUCKET ?? `${readProjectName(cwd)}-assets`;
  if (!wranglerOk(['r2', 'bucket', 'list'])) {
    return { ok: false, message: 'Could not list R2 buckets — check wrangler auth.' };
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

  let accessKeyId = env.R2_ACCESS_KEY_ID;
  let secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!(accessKeyId && secretAccessKey)) {
    const token = await createR2ApiToken(accountId, apiToken, bucketName);
    if (!token) {
      return {
        ok: false,
        message: 'Could not create R2 API token — check Cloudflare API token permissions.',
      };
    }
    accessKeyId = token.accessKeyId;
    secretAccessKey = token.secretAccessKey;
  }

  const publicUrl =
    env.R2_PUBLIC_URL ?? `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

  writeEnvKeys(cwd, {
    STORAGE_PROVIDER: 'r2',
    R2_ACCOUNT_ID: accountId,
    R2_BUCKET: bucketName,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_PUBLIC_URL: publicUrl,
  });

  return { ok: true, message: `R2 storage ready (bucket: ${bucketName}).` };
}
