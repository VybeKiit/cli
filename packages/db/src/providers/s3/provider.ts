// `@aws-sdk/client-s3` is the AWS SDK v3 client for Amazon S3 object storage. We use
// the command-style API (PutObjectCommand/DeleteObjectCommand) so the adapter reads
// like the step-4 DynamoDB adapter — one client constructed here, commands sent
// through `.send` — rather than the legacy v2 callback client.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { AwsConfig } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import type { StorageProvider } from '@vybekiit/db/types';
import { Effect } from 'effect';

/**
 * Build the AWS S3 {@link StorageProvider} — the opt-in object store a buyer selects
 * with `STORAGE_PROVIDER=s3` (ADR-0002), the storage counterpart to the DynamoDB data
 * adapter.
 *
 * Credentials mirror the AWS data adapter exactly: `AWS_REGION` is always required;
 * when both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are present we pass them
 * explicitly, otherwise we leave `credentials` unset so the SDK's default credential
 * chain (instance role, shared config, env vars) applies — the normal path on AWS infra.
 *
 * One {@link S3Client} is constructed here and reused. `upload`/`remove` map a thrown
 * SDK error into a tagged DB failure with the same `storage_*` codes the Supabase
 * storage adapter uses.
 *
 * @param config - Validated AWS config.
 * @returns Storage provider backed by S3.
 * @example
 * const provider = createS3StorageProvider(config);
 */
export const createS3StorageProvider = (config: AwsConfig): StorageProvider => {
  const hasExplicitCredentials =
    config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;

  const client = new S3Client({
    region: config.AWS_REGION,
    ...(hasExplicitCredentials
      ? {
          credentials: {
            // Narrowed to non-null by `hasExplicitCredentials`.
            accessKeyId: config.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
          },
        }
      : {}),
  });

  return {
    name: 's3',

    upload: (bucket: string, key: string, data: Uint8Array, contentType?: string) =>
      tryDb(
        'storage_upload_failed',
        async () => {
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: data,
              ...(contentType ? { ContentType: contentType } : {}),
            }),
          );
          return { key };
        },
        'unknown S3 error',
      ),

    getUrl: (bucket: string, key: string) => {
      // v1 returns the virtual-hosted public URL (KISS) — correct for buckets the
      // upload makes publicly readable, which is the default product surface. A
      // private bucket would instead need a presigned URL (getSignedUrl), out of
      // scope here. This is pure string-building, so it cannot fail.
      const url = `https://${bucket}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
      return Effect.succeed({ url });
    },

    remove: (bucket: string, key: string) =>
      tryDb(
        'storage_remove_failed',
        async () => {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          return true as const;
        },
        'unknown S3 error',
      ),
  };
};
