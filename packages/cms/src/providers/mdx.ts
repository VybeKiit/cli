import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { MdxCmsConfig } from '@vybekiit/core';
import type { CmsPage, CmsProvider } from '../types';

type ParsedMdx = {
  readonly title: string;
  readonly description?: string | undefined;
  readonly body: string;
};

const pageCache = new Map<string, ParsedMdx | null>();

function parseFrontmatter(raw: string): ParsedMdx {
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!frontmatterMatch) {
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    return { title: titleMatch?.[1]?.trim() ?? 'Untitled', body: raw };
  }

  const [, frontmatterBlock, bodyBlock] = frontmatterMatch;
  const frontmatter = frontmatterBlock ?? '';
  const body = bodyBlock ?? '';
  const fields = new Map<string, string>();
  for (const line of frontmatter.split('\n')) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (match?.[1] && match[2]) {
      fields.set(match[1], match[2].replace(/^["']|["']$/g, '').trim());
    }
  }

  const titleFromFm = fields.get('title');
  const titleFromHeading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = titleFromFm ?? titleFromHeading ?? 'Untitled';
  const description = fields.get('description');

  return {
    title,
    ...(description ? { description } : {}),
    body: body.trim(),
  };
}

async function readMdxFile(dir: string, slug: string): Promise<CmsPage | null> {
  const cacheKey = `${dir}:${slug}`;
  if (pageCache.has(cacheKey)) {
    const cached = pageCache.get(cacheKey);
    return cached ? { slug, ...cached } : null;
  }

  const path = join(process.cwd(), dir, `${slug}.mdx`);
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = parseFrontmatter(raw);
    pageCache.set(cacheKey, parsed);
    return { slug, ...parsed };
  } catch {
    pageCache.set(cacheKey, null);
    return null;
  }
}

export function createMdxCms(config: MdxCmsConfig): CmsProvider {
  const dir = config.CMS_CONTENT_DIR;
  return {
    name: 'mdx',
    async getPage(slug: string): Promise<CmsPage | null> {
      return readMdxFile(dir, slug);
    },
    async listPages(): Promise<readonly CmsPage[]> {
      const contentDir = join(process.cwd(), dir);
      try {
        const files = await readdir(contentDir);
        const pages: CmsPage[] = [];
        for (const file of files) {
          if (!file.endsWith('.mdx')) continue;
          const slug = file.replace(/\.mdx$/, '');
          const page = await readMdxFile(dir, slug);
          if (page) pages.push(page);
        }
        return pages;
      } catch {
        return [];
      }
    },
    async getMetadata(slug: string) {
      const page = await readMdxFile(dir, slug);
      if (!page) return null;
      return { title: page.title, description: page.description ?? page.title };
    },
  };
}

/** Clear in-process page cache (tests / hot reload). */
export function clearMdxCmsCache(): void {
  pageCache.clear();
}
