// Cloudflare R2 object storage via the S3-compatible API. R2 exposes an S3 endpoint
// so we reuse `@aws-sdk/client-s3` with a custom endpoint URL — same command pattern
// as the AWS S3 adapter, different endpoint + credential keys.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { R2Config } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import type { StorageProvider } from '@vybekiit/db/types';
import { Effect } from 'effect';

/**
 * Build the Cloudflare R2 {@link StorageProvider} — selected with `STORAGE_PROVIDER=r2`
 * on the default Cloudflare stack (ADR-0010). Doctor provisions the bucket and writes
 * these keys; the builder never picks R2 by name.
 *
 * @param config - Validated R2 config.
 * @returns Storage provider backed by Cloudflare R2.
 * @example
 * const provider = createR2StorageProvider(config);
 */
export const createR2StorageProvider = (config: R2Config): StorageProvider => {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });

  const bucket = config.R2_BUCKET;
  const publicBase = config.R2_PUBLIC_URL.endsWith('/')
    ? config.R2_PUBLIC_URL.slice(0, -1)
    : config.R2_PUBLIC_URL;

  return {
    name: 'r2',

    upload: (_bucket: string, key: string, data: Uint8Array, contentType?: string) =>
      tryDb(
        'storage_upload_failed',
        async () => {
          const commandInput =
            contentType === undefined
              ? { Bucket: bucket, Key: key, Body: data }
              : { Bucket: bucket, Key: key, Body: data, ContentType: contentType };
          await client.send(new PutObjectCommand(commandInput));
          return { key };
        },
        'unknown R2 error',
      ),

    getUrl: (_bucket: string, key: string) => {
      const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
      const url = `${publicBase}/${normalizedKey}`;
      return Effect.succeed({ url });
    },

    remove: (_bucket: string, key: string) =>
      tryDb(
        'storage_remove_failed',
        async () => {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          return true as const;
        },
        'unknown R2 error',
      ),
  };
};
