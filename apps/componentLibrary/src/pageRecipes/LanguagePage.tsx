'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Switch } from '@vybekiit/ui/switch';
import { Check, Globe2, Languages, Search } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type LocaleCode = 'en' | 'he' | 'es' | 'fr' | 'de' | 'pt';

/** One locale row the builder can enable for the app. */
type LocaleRow = {
  readonly code: LocaleCode;
  readonly name: string;
  readonly nativeName: string;
  readonly enabled: boolean;
  readonly coverage: number;
};

const PREVIEW_PHRASES: Record<LocaleCode, string> = {
  en: 'Welcome to your dashboard.',
  he: 'ברוכים הבאים ללוח הבקרה שלך.',
  es: 'Bienvenido a tu panel.',
  fr: 'Bienvenue sur votre tableau de bord.',
  de: 'Willkommen in Ihrem Dashboard.',
  pt: 'Bem-vindo ao seu painel.',
};

const INITIAL_LOCALES: readonly LocaleRow[] = [
  { code: 'en', name: 'English', nativeName: 'English', enabled: true, coverage: 100 },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: true, coverage: 86 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: false, coverage: 72 },
  { code: 'fr', name: 'French', nativeName: 'Français', enabled: false, coverage: 64 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: false, coverage: 58 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: false, coverage: 41 },
];

/**
 * Interactive language setup: enable locales, pick a default, preview a phrase, and filter the list.
 * Plug-in panel maps onto i18n routing and message files.
 *
 * @returns The language recipe element.
 * @example
 * const element = <LanguagePage />;
 */
export const LanguagePage = () => {
  // TODO: Connect locale choices to the configured i18n routing source.
  // TODO: Replace default strings with translated message files.
  const searchId = useId();
  const filterLabelId = useId();

  const [locales, setLocales] = useState<readonly LocaleRow[]>(INITIAL_LOCALES);
  const [defaultLocale, setDefaultLocale] = useState<LocaleCode>('en');
  const [previewLocale, setPreviewLocale] = useState<LocaleCode>('en');
  const [query, setQuery] = useState('');
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locales.filter((locale) => {
      if (showEnabledOnly && !locale.enabled) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return (
        locale.name.toLowerCase().includes(q) ||
        locale.nativeName.toLowerCase().includes(q) ||
        locale.code.includes(q)
      );
    });
  }, [locales, query, showEnabledOnly]);

  const enabledCount = locales.filter((locale) => locale.enabled).length;

  const toggleLocale = (code: LocaleCode) => {
    setLocales((current) =>
      current.map((locale) => {
        if (locale.code !== code) {
          return locale;
        }
        if (locale.enabled && code === defaultLocale) {
          setNotice('Switch the default locale before turning this one off.');
          return locale;
        }
        return { ...locale, enabled: !locale.enabled };
      }),
    );
    setSaved(false);
  };

  const makeDefault = (code: LocaleCode) => {
    setLocales((current) =>
      current.map((locale) => (locale.code === code ? { ...locale, enabled: true } : locale)),
    );
    setDefaultLocale(code);
    setPreviewLocale(code);
    setSaved(false);
    setNotice(`${code.toUpperCase()} is now the default locale.`);
  };

  const saveLocales = () => {
    setSaved(true);
    setNotice(`Saved ${enabledCount} active locale${enabledCount === 1 ? '' : 's'}.`);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Languages
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Translate your app</h1>
          <p className="max-w-xl text-muted-foreground">
            Enable locales, pick a default, and preview a phrase. Coverage updates from the live
            toggle state.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="Enabled" value={String(enabledCount)} />
          <Kpi label="Default" value={defaultLocale.toUpperCase()} />
          <Kpi label="Draft" value={saved ? 'Saved' : 'Unsaved'} />
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Locales</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      aria-label="Search locales"
                      className="h-9 w-44 pl-8"
                      id={searchId}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search…"
                      value={query}
                    />
                  </div>
                  <button
                    aria-labelledby={filterLabelId}
                    aria-pressed={showEnabledOnly}
                    className={cn(
                      'rounded-md border px-3 py-1.5 font-medium text-sm transition-colors',
                      showEnabledOnly
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    id={filterLabelId}
                    onClick={() => setShowEnabledOnly((value) => !value)}
                    type="button"
                  >
                    Enabled only
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <Languages aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                  <h2 className="mt-3 font-semibold">No locales match</h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Clear search or show every locale.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setQuery('');
                      setShowEnabledOnly(false);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <ul aria-label="Locale list" className="divide-y">
                  {visible.map((locale) => (
                    <li
                      className="flex flex-wrap items-center gap-3 px-2 py-3 sm:flex-nowrap"
                      key={locale.code}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Globe2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">
                          {locale.name}{' '}
                          <span className="text-muted-foreground">({locale.nativeName})</span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {locale.code.toUpperCase()} · {locale.coverage}% translated
                          {locale.code === defaultLocale ? ' · Default' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {locale.code === defaultLocale ? (
                          <Badge className="font-normal" variant="secondary">
                            Default
                          </Badge>
                        ) : (
                          <Button
                            disabled={!locale.enabled}
                            onClick={() => makeDefault(locale.code)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            Make default
                          </Button>
                        )}
                        <Switch
                          aria-label={`Toggle ${locale.name}`}
                          checked={locale.enabled}
                          onCheckedChange={() => toggleLocale(locale.code)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview phrase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="preview-locale">Locale</Label>
                  <div className="flex flex-wrap gap-1">
                    {locales
                      .filter((locale) => locale.enabled)
                      .map((locale) => (
                        <button
                          aria-pressed={previewLocale === locale.code}
                          className={cn(
                            'rounded-md border px-2.5 py-1 font-medium text-xs transition-colors',
                            previewLocale === locale.code
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          key={locale.code}
                          onClick={() => setPreviewLocale(locale.code)}
                          type="button"
                        >
                          {locale.code.toUpperCase()}
                        </button>
                      ))}
                  </div>
                </div>
                <p
                  className={cn(
                    'rounded-lg border bg-muted/40 p-3 text-sm',
                    previewLocale === 'he' && 'text-right',
                  )}
                  dir={previewLocale === 'he' ? 'rtl' : 'ltr'}
                >
                  {PREVIEW_PHRASES[previewLocale]}
                </p>
              </CardContent>
            </Card>

            <Button className="w-full" disabled={saved} onClick={saveLocales} type="button">
              <Check aria-hidden="true" className="h-4 w-4" />
              {saved ? 'All changes saved' : 'Save languages'}
            </Button>
          </div>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — toggles, default locale, preview, and filters all
              recompute live. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Point locale enable/default at your i18n routing config (middleware or{' '}
                <code>next-intl</code> / kit locale rules).
              </li>
              <li>
                Replace <code>PREVIEW_PHRASES</code> and UI copy with message files per locale (
                <code>messages/en.json</code>, etc.).
              </li>
              <li>
                Persist the enabled set via <code>PATCH /api/settings/locales</code> when Save is
                pressed.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Language motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** Small count tile. */
const Kpi = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <p className="font-semibold text-2xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </CardContent>
  </Card>
);
