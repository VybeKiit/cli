import { describe, expect, it } from 'vitest';
import { createCloudflareR2Delivery } from '../src/providers/index';
import { resolveAssetDelivery } from '../src/resolve';

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
  it('defaults to cloudflare + supabase delivery', () => {
    const provider = resolveAssetDelivery({
      ...cloudflareEnv,
      SUPABASE_URL: 'https://xyz.supabase.co',
      SUPABASE_ANON_KEY: 'anon',
    });
    expect(provider.name).toBe('cloudflare-supabase');
  });

  it('constructs cloudflare + r2 delivery when STORAGE_PROVIDER=r2', () => {
    const provider = resolveAssetDelivery({
      ...cloudflareEnv,
      ...r2Env,
      STORAGE_PROVIDER: 'r2',
    });
    expect(provider.name).toBe('cloudflare-r2');
  });

  it('constructs vercel delivery when HOSTING_PROVIDER=vercel', () => {
    const provider = resolveAssetDelivery({
      HOSTING_PROVIDER: 'vercel',
      VERCEL_TOKEN: 'token',
      APP_URL: 'https://app.example.com',
    });
    expect(provider.name).toBe('vercel');
  });

  it('constructs aws delivery when HOSTING_PROVIDER=aws', () => {
    const provider = resolveAssetDelivery({
      HOSTING_PROVIDER: 'aws',
      AWS_REGION: 'us-east-1',
      APP_URL: 'https://app.example.com',
    });
    expect(provider.name).toBe('aws-s3');
  });
});

describe('createCloudflareR2Delivery', () => {
  it('builds CF image resize URLs for R2 objects', () => {
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

    const url = delivery.url('uploads/photo.jpg', { width: 800, format: 'webp' });
    expect(url).toContain('/cdn-cgi/image/');
    expect(url).toContain('width=800');
    expect(url).toContain('format=webp');
    expect(url).toContain(encodeURIComponent('https://pub.r2.dev/bucket/uploads/photo.jpg'));
  });
});
