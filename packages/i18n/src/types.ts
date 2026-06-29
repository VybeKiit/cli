export type I18nProviderName = 'local';

export interface I18nProvider {
  readonly name: I18nProviderName;
  resolveLocale(requested?: string | undefined): string;
  isRtl(locale: string): boolean;
  loadCatalog(locale: string): Promise<Record<string, string>>;
}
