import { describe, expect, it } from 'vitest';
import { resolveSeoProvider } from '../src/resolve';

const env = {
  APP_URL: 'https://example.com',
  NODE_ENV: 'production',
};

describe('resolveSeoProvider', () => {
  it('builds metadata with canonical URL', () => {
    const seo = resolveSeoProvider(env);
    const meta = seo.buildMetadata({ title: 'Home', path: '/about' });
    expect(meta.canonicalUrl).toBe('https://example.com/about');
  });

  it('builds Open Graph from metadata', () => {
    const seo = resolveSeoProvider(env);
    const og = seo.buildOpenGraph({
      title: 'Post',
      description: 'Summary',
      path: '/blog/post',
      type: 'article',
    });
    expect(og.url).toBe('https://example.com/blog/post');
    expect(og.type).toBe('article');
  });

  it('builds BlogPosting JSON-LD', () => {
    const seo = resolveSeoProvider(env);
    const jsonLd = seo.buildJsonLdBlogPosting({
      title: 'Hello',
      path: '/blog/hello',
      publishedAt: '2026-01-01',
    });
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('BlogPosting');
  });

  it('builds FAQPage JSON-LD', () => {
    const seo = resolveSeoProvider(env);
    const jsonLd = seo.buildJsonLdFaq([
      { question: 'What is this?', answer: 'An app built with VybeKiit.' },
    ]);
    expect(jsonLd['@type']).toBe('FAQPage');
  });

  it('builds llms.txt with page URLs', () => {
    const seo = resolveSeoProvider(env);
    const txt = seo.buildLlmsTxt({
      siteName: 'My App',
      siteDescription: 'A product built for users.',
      pages: [{ path: '/blog', title: 'Blog', summary: 'Updates and news' }],
    });
    expect(txt).toContain('https://example.com/blog');
    expect(txt).toContain('My App');
  });

  it('suggests hub-spoke internal links', () => {
    const seo = resolveSeoProvider(env);
    const links = seo.suggestInternalLinks('/blog', [
      { path: '/blog/welcome', anchor: 'Welcome post' },
    ]);
    expect(links.length).toBe(2);
    expect(links[0]?.anchorText).toBe('Welcome post');
  });

  it('maps to Next metadata shape', () => {
    const seo = resolveSeoProvider(env);
    const meta = seo.buildMetadata({ title: 'T', path: '/' });
    const og = seo.buildOpenGraph({ title: 'T', path: '/' });
    const next = seo.toNextMetadata(meta, og);
    expect(next.alternates?.canonical).toBe('https://example.com');
    expect(next.openGraph?.url).toBe('https://example.com');
  });
});
