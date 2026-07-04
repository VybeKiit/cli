// Cloudflare R2 object storage via the S3-compatible API. R2 exposes an S3 endpoint
// so we reuse `@aws-sdk/client-s3` with a custom endpoint URL — same command pattern
// as the AWS S3 adapter, different endpoint + credential keys.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fail, ok, type R2Config, type Result } from '@vybekiit/core';
import { type StorageProviderResult, toEffectStorageProvider } from '@vybekiit/db/effectBridge';
import type { StorageProvider } from '@vybekiit/db/types';

/**
 * Build the Cloudflare R2 {@link StorageProvider} — selected with `STORAGE_PROVIDER=r2`
 * on the default Cloudflare stack (ADR-0010). Doctor provisions the bucket and writes
 * these keys; the builder never picks R2 by name.
 */
export function createR2StorageProvider(config: R2Config): StorageProvider {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });

  const bucket = config.R2_BUCKET;
  // drop a trailing slash from the public base: "https://x.com/" → "https://x.com"
  const publicBase = config.R2_PUBLIC_URL.replace(/\/$/, '');

  const impl: StorageProviderResult = {
    name: 'r2',

    async upload(
      _bucket: string,
      key: string,
      data: Uint8Array,
      contentType?: string,
    ): Promise<Result<{ key: string }>> {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: data,
            ...(contentType ? { ContentType: contentType } : {}),
          }),
        );
        return ok({ key });
      } catch (error) {
        return fail('storage_upload_failed', errorMessage(error));
      }
    },

    getUrl(_bucket: string, key: string): Promise<Result<{ url: string }>> {
      // drop a leading slash from the object key: "/logo.png" → "logo.png"
      const url = `${publicBase}/${key.replace(/^\//, '')}`;
      return Promise.resolve(ok({ url }));
    },

    async remove(_bucket: string, key: string): Promise<Result<true>> {
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        return ok(true);
      } catch (error) {
        return fail('storage_remove_failed', errorMessage(error));
      }
    },
  };
  return toEffectStorageProvider(impl);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown R2 error';
}
