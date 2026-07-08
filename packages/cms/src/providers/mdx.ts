import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import type { MdxCmsConfigType } from '@vybekiit/cms/config';
import { CmsError, type CmsPageType, type CmsService } from '@vybekiit/cms/types';
import { Effect } from 'effect';

type ParsedMdx = {
  readonly title: string;
  readonly description?: string | undefined;
  readonly body: string;
};

const pageCache = new Map<string, ParsedMdx | null>();

// `"---\ntitle: X\n---\nBody"` -> frontmatter `title: X`, body `Body`.
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
// `# Hello` -> `Hello`.
const HEADING_TITLE_PATTERN = /^#\s+(.+)$/m;
// `title: Hello` -> key `title`, value `Hello`.
const FRONTMATTER_FIELD_PATTERN = /^([a-zA-Z0-9_-]+):\s*(.+)$/;
// `"Hello"` -> `Hello`.
const SURROUNDING_QUOTES_PATTERN = /^["']|["']$/g;
// `about.mdx` -> `about`.
const MDX_EXTENSION_PATTERN = /\.mdx$/;

/**
 * Read the first captured title from markdown heading syntax.
 *
 * @param text - Markdown content to inspect.
 * @returns Trimmed heading title, or undefined when no heading exists.
 * @example
 * const title = readHeadingTitle('# Hello');
 */
const readHeadingTitle = (text: string): string | undefined => {
  const titleMatch = text.match(HEADING_TITLE_PATTERN);
  if (titleMatch === null) {
    return;
  }

  const [, title] = titleMatch;
  if (title === undefined) {
    return;
  }

  return title.trim();
};

/**
 * Strip one pair of surrounding quotes from a frontmatter value.
 *
 * @param value - Raw frontmatter value.
 * @returns Trimmed frontmatter value without surrounding quotes.
 * @example
 * const value = cleanFrontmatterValue('"Hello"');
 */
const cleanFrontmatterValue = (value: string): string =>
  value.replace(SURROUNDING_QUOTES_PATTERN, '').trim();

/**
 * Parse simple key/value frontmatter into a map.
 *
 * @param frontmatter - Raw frontmatter block without delimiters.
 * @returns Parsed frontmatter fields.
 * @example
 * const fields = parseFrontmatterFields('title: Hello');
 */
const parseFrontmatterFields = (frontmatter: string): Map<string, string> => {
  const fields = new Map<string, string>();
  for (const line of frontmatter.split('\n')) {
    const match = line.match(FRONTMATTER_FIELD_PATTERN);
    if (match !== null) {
      const [, key, value] = match;
      if (key !== undefined && value !== undefined) {
        fields.set(key, cleanFrontmatterValue(value));
      }
    }
  }
  return fields;
};

/**
 * Resolve a page title from frontmatter, heading, or the maintained default.
 *
 * @param fields - Parsed frontmatter fields.
 * @param body - Markdown body content.
 * @returns Page title.
 * @example
 * const title = resolvePageTitle(fields, '# Hello');
 */
const resolvePageTitle = (fields: Map<string, string>, body: string): string => {
  const titleFromFrontmatter = fields.get('title');
  if (titleFromFrontmatter !== undefined) {
    return titleFromFrontmatter;
  }

  const titleFromHeading = readHeadingTitle(body);
  if (titleFromHeading !== undefined) {
    return titleFromHeading;
  }

  return 'Untitled';
};

/**
 * Parse MDX frontmatter and body content.
 *
 * @param raw - Raw MDX file content.
 * @returns Parsed title, optional description, and body.
 * @example
 * const page = parseFrontmatter('---\\ntitle: Hello\\n---\\nBody');
 */
const parseFrontmatter = (raw: string): ParsedMdx => {
  const frontmatterMatch = raw.match(FRONTMATTER_PATTERN);
  if (frontmatterMatch === null) {
    const title = readHeadingTitle(raw);
    if (title === undefined) {
      return { title: 'Untitled', body: raw };
    }
    return { title, body: raw };
  }

  const [, frontmatterBlock, bodyBlock] = frontmatterMatch;
  const frontmatter = frontmatterBlock === undefined ? '' : frontmatterBlock;
  const body = bodyBlock === undefined ? '' : bodyBlock;
  const fields = parseFrontmatterFields(frontmatter);

  const title = resolvePageTitle(fields, body);
  const description = fields.get('description');

  return {
    title,
    ...(description === undefined || description.length === 0 ? {} : { description }),
    body: body.trim(),
  };
};

/**
 * Return a cached MDX page when the cache has already seen the slug.
 *
 * @param cacheKey - Directory and slug cache key.
 * @param slug - Page slug without `.mdx`.
 * @returns Cached CMS page, cached miss, or undefined when uncached.
 * @example
 * const page = readCachedPage('content:about', 'about');
 */
const readCachedPage = (cacheKey: string, slug: string): CmsPageType | null | undefined => {
  if (!pageCache.has(cacheKey)) {
    return;
  }

  const cached = pageCache.get(cacheKey);
  if (cached === undefined || cached === null) {
    return null;
  }

  return { slug, ...cached };
};

/**
 * Cache a parsed MDX page and return its CMS record.
 *
 * @param cacheKey - Directory and slug cache key.
 * @param slug - Page slug without `.mdx`.
 * @param raw - Raw MDX file content.
 * @returns Parsed CMS page record.
 * @example
 * const page = cacheParsedPage('content:about', 'about', raw);
 */
const cacheParsedPage = (cacheKey: string, slug: string, raw: string): CmsPageType => {
  const parsed = parseFrontmatter(raw);
  pageCache.set(cacheKey, parsed);
  return { slug, ...parsed };
};

/**
 * Read one MDX page from disk with an in-process cache.
 *
 * @param dir - Content directory relative to the current working directory.
 * @param slug - Page slug without `.mdx`.
 * @returns Effect that resolves to a parsed CMS page, or null when unavailable.
 * @example
 * const page = await Effect.runPromise(readMdxFile('content', 'about'));
 */
const readMdxFile = (dir: string, slug: string): Effect.Effect<CmsPageType | null, CmsError> => {
  const cacheKey = `${dir}:${slug}`;
  const cached = readCachedPage(cacheKey, slug);
  if (cached !== undefined) {
    return Effect.succeed(cached);
  }

  const path = join(process.cwd(), dir, `${slug}.mdx`);
  return Effect.tryPromise({
    try: () => readFile(path, 'utf8'),
    catch: () =>
      new CmsError({
        code: 'CMS_READ_FAILED',
        message: `Unable to read CMS page ${slug}.`,
      }),
  }).pipe(
    Effect.map((raw) => cacheParsedPage(cacheKey, slug, raw)),
    Effect.catchTag('CmsError', () =>
      Effect.sync(() => {
        pageCache.set(cacheKey, null);
        return null;
      }),
    ),
  );
};

/**
 * List all readable MDX pages in a content directory.
 *
 * @param dir - Content directory relative to the current working directory.
 * @returns Effect that resolves to every readable parsed CMS page.
 * @example
 * const pages = await Effect.runPromise(listMdxPages('content'));
 */
const listMdxPages = (dir: string): Effect.Effect<readonly CmsPageType[], CmsError> => {
  const contentDir = join(process.cwd(), dir);
  return Effect.tryPromise({
    try: () => readdir(contentDir),
    catch: () =>
      new CmsError({
        code: 'CMS_READ_FAILED',
        message: `Unable to read CMS content directory ${dir}.`,
      }),
  }).pipe(
    Effect.flatMap((files) => {
      const slugs = files
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => file.replace(MDX_EXTENSION_PATTERN, ''));
      return Effect.all(slugs.map((slug) => readMdxFile(dir, slug)));
    }),
    Effect.map((pages) => pages.filter((page): page is CmsPageType => page !== null)),
    Effect.catchTag('CmsError', () => Effect.succeed([])),
  );
};

/**
 * Read CMS metadata for one MDX page.
 *
 * @param dir - Content directory relative to the current working directory.
 * @param slug - Page slug without `.mdx`.
 * @returns Effect that resolves to page metadata, or null when unavailable.
 * @example
 * const metadata = await Effect.runPromise(readMdxMetadata('content', 'about'));
 */
const readMdxMetadata = (
  dir: string,
  slug: string,
): Effect.Effect<{ readonly description: string; readonly title: string } | null, CmsError> =>
  readMdxFile(dir, slug).pipe(
    Effect.map((page) => {
      if (page === null) {
        return null;
      }

      const description = page.description === undefined ? page.title : page.description;
      return { title: page.title, description };
    }),
  );

/**
 * Create an MDX-backed CMS service.
 *
 * @param config - Parsed MDX CMS config.
 * @returns CMS service backed by local `.mdx` files.
 * @example
 * const cms = createMdxCms({ CMS_CONTENT_DIR: 'content' });
 */
export const createMdxCms = (config: MdxCmsConfigType): CmsService => {
  const dir = config.CMS_CONTENT_DIR;
  return {
    name: 'mdx',
    getPage: (slug: string) => readMdxFile(dir, slug),
    listPages: () => listMdxPages(dir),
    getMetadata: (slug: string) => readMdxMetadata(dir, slug),
  };
};

/**
 * Clear the in-process MDX page cache.
 *
 * @returns Nothing; page cache is emptied in place.
 * @example
 * clearMdxCmsCache();
 */
export const clearMdxCmsCache = (): void => {
  pageCache.clear();
};
