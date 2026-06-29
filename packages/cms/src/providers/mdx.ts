import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { MdxCmsConfig } from '@vybekiit/core';
import type { CmsPage, CmsProvider } from '../types';

async function readMdxFile(dir: string, slug: string): Promise<CmsPage | null> {
  const path = join(process.cwd(), dir, `${slug}.mdx`);
  try {
    const body = await readFile(path, 'utf8');
    const titleMatch = body.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? slug;
    return { slug, title, body };
  } catch {
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
