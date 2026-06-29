// Cloudflare R2 object storage via the S3-compatible API. R2 exposes an S3 endpoint
// so we reuse `@aws-sdk/client-s3` with a custom endpoint URL — same command pattern
// as the AWS S3 adapter, different endpoint + credential keys.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { type R2Config, type Result, fail, ok } from '@vybekiit/core';
import type { StorageProvider } from '../../types';

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
  const publicBase = config.R2_PUBLIC_URL.replace(/\/$/, '');

  return {
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
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown R2 error';
}
