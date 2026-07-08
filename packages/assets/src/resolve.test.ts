import { it } from '@effect/vitest';
import { createCloudflareR2Delivery } from '@vybekiit/assets/providers';
import { resolveAssetDelivery } from '@vybekiit/assets/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
  APP_URL: 'https://app.example.com',
};

const r2Env = {
  R2_ACCOUNT_ID: 'acct',
  R2_BUCKET: 'my-app-assets',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_PUBLIC_URL: 'https://pub.r2.dev/bucket',
};

describe('resolveAssetDelivery', () => {
  it.effect('defaults to local asset delivery from Schema config', () =>
    Effect.gen(function* () {
      const provider = yield* resolveAssetDelivery({});
      expect(provider.name).toBe('local');
    }),
  );

  it.effect('fails loud when cloudflare+r2 config is incomplete', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveAssetDelivery({
          HOSTING_PROVIDER: 'cloudflare',
          STORAGE_PROVIDER: 'r2',
          APP_URL: 'https://app.example.com',
        }),
      );
      expect(error.code).toBe('ASSET_CONFIG_INVALID');
      expect(error.message).toContain('CLOUDFLARE_ACCOUNT_ID');
    }),
  );

  it.effect('fails loud when r2 config is incomplete after cloudflare config resolves', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveAssetDelivery({
          ...cloudflareEnv,
          HOSTING_PROVIDER: 'cloudflare',
          STORAGE_PROVIDER: 'r2',
          APP_URL: 'https://app.example.com',
        }),
      );
      expect(error.code).toBe('ASSET_CONFIG_INVALID');
      expect(error.message).toContain('R2_PUBLIC_URL');
    }),
  );
});

describe('resolveAssetDelivery configured providers', () => {
  it.effect('constructs cloudflare + supabase delivery when configured', () =>
    Effect.gen(function* () {
      const provider = yield* resolveAssetDelivery({
        ...cloudflareEnv,
        HOSTING_PROVIDER: 'cloudflare',
        SUPABASE_URL: 'https://xyz.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
      });
      expect(provider.name).toBe('cloudflare-supabase');
    }),
  );

  it.effect('constructs cloudflare + r2 delivery when STORAGE_PROVIDER=r2', () =>
    Effect.gen(function* () {
      const provider = yield* resolveAssetDelivery({
        ...cloudflareEnv,
        ...r2Env,
        HOSTING_PROVIDER: 'cloudflare',
        STORAGE_PROVIDER: 'r2',
      });
      expect(provider.name).toBe('cloudflare-r2');
    }),
  );

  it.effect('constructs vercel delivery when HOSTING_PROVIDER=vercel', () =>
    Effect.gen(function* () {
      const provider = yield* resolveAssetDelivery({
        HOSTING_PROVIDER: 'vercel',
        APP_URL: 'https://app.example.com',
      });
      expect(provider.name).toBe('vercel');
    }),
  );

  it.effect('constructs aws delivery when HOSTING_PROVIDER=aws', () =>
    Effect.gen(function* () {
      const provider = yield* resolveAssetDelivery({
        HOSTING_PROVIDER: 'aws',
        AWS_REGION: 'us-east-1',
        APP_URL: 'https://app.example.com',
      });
      expect(provider.name).toBe('aws-s3');
    }),
  );
});

describe('createCloudflareR2Delivery', () => {
  it.effect('builds CF image resize URLs for R2 objects', () =>
    Effect.gen(function* () {
      const delivery = createCloudflareR2Delivery({
        cloudflare: {
          CLOUDFLARE_ACCOUNT_ID: 'acct',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        r2: {
          R2_ACCOUNT_ID: 'acct',
          R2_BUCKET: 'bucket',
          R2_ACCESS_KEY_ID: 'key',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_PUBLIC_URL: 'https://pub.r2.dev/bucket',
        },
        app: { APP_URL: 'https://app.example.com', NODE_ENV: 'production' },
      });

      const verified = yield* delivery.verifyDelivery();
      const url = delivery.url('uploads/photo.jpg', { width: 800, format: 'webp' });

      expect(verified).toBe(true);
      expect(url).toContain('/cdn-cgi/image/');
      expect(url).toContain('width=800');
      expect(url).toContain('format=webp');
      expect(url).toContain(encodeURIComponent('https://pub.r2.dev/bucket/uploads/photo.jpg'));
    }),
  );
});
