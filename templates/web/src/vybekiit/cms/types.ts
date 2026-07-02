export type CmsProviderName = 'mdx' | 'local';

export interface CmsPage {
  readonly slug: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly body?: string | undefined;
}

export interface CmsProvider {
  readonly name: CmsProviderName;
  getPage(slug: string): Promise<CmsPage | null>;
  listPages(): Promise<readonly CmsPage[]>;
  getMetadata(slug: string): Promise<{ title: string; description: string } | null>;
}
