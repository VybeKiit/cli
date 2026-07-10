import { afterEach, describe, expect, it } from 'vitest';
import { assetsBaseUrl, cdnAssetUrl, DEFAULT_ASSETS_BASE_URL } from '@/lib/cdnAssets';

const original = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL = original;
  }
});

describe('cdnAssets', () => {
  it('defaults to the landing R2 public origin', () => {
    delete process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
    expect(assetsBaseUrl()).toBe(DEFAULT_ASSETS_BASE_URL);
    expect(cdnAssetUrl('/brand-marks/claude.webp')).toBe(
      `${DEFAULT_ASSETS_BASE_URL}/brand-marks/claude.webp`,
    );
  });

  it('honors NEXT_PUBLIC_ASSETS_BASE_URL without a trailing slash', () => {
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL = 'https://cdn.example.com/assets/';
    expect(assetsBaseUrl()).toBe('https://cdn.example.com/assets');
    expect(cdnAssetUrl('brand-marks/aws.webp')).toBe(
      'https://cdn.example.com/assets/brand-marks/aws.webp',
    );
  });

  it('leaves absolute URLs unchanged', () => {
    expect(cdnAssetUrl('https://other.example/x.webp')).toBe('https://other.example/x.webp');
  });
});
