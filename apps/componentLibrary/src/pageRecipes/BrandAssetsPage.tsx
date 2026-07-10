'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { ImageIcon, Palette, Save, Upload, X } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type AssetSlot = 'logo' | 'hero' | 'icon';

/** One brand asset slot the builder can fill. */
type BrandAsset = {
  readonly id: AssetSlot;
  readonly label: string;
  readonly hint: string;
  readonly filled: boolean;
  readonly fileName: string | null;
};

const INITIAL_ASSETS: readonly BrandAsset[] = [
  {
    id: 'logo',
    label: 'Logo',
    hint: 'SVG or PNG, transparent preferred',
    filled: false,
    fileName: null,
  },
  {
    id: 'hero',
    label: 'Hero image',
    hint: '1600×900 landscape',
    filled: true,
    fileName: 'hero-default.jpg',
  },
  {
    id: 'icon',
    label: 'App icon',
    hint: '1024×1024 square',
    filled: false,
    fileName: null,
  },
];

const RADIUS_OPTIONS = [
  { value: 4, label: 'Sharp' },
  { value: 10, label: 'Soft' },
  { value: 20, label: 'Round' },
] as const;

/**
 * Interactive brand assets: edit name/color/radius, simulate uploads, save dirty style.
 *
 * @returns The brand assets recipe element.
 * @example
 * const element = <BrandAssetsPage />;
 */
export const BrandAssetsPage = () => {
  // TODO: Replace default logo and image slots with uploaded brand assets.
  // TODO: Save color and shape choices through the design token source.
  const nameId = useId();
  const colorId = useId();

  const [brandName, setBrandName] = useState('VybeKiit');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [radius, setRadius] = useState(10);
  const [assets, setAssets] = useState<readonly BrandAsset[]>(INITIAL_ASSETS);
  const [savedSnapshot, setSavedSnapshot] = useState({
    brandName: 'VybeKiit',
    primaryColor: '#2563eb',
    radius: 10,
  });
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      brandName !== savedSnapshot.brandName ||
      primaryColor !== savedSnapshot.primaryColor ||
      radius !== savedSnapshot.radius,
    [brandName, primaryColor, radius, savedSnapshot],
  );

  const filledCount = assets.filter((asset) => asset.filled).length;
  const colorValid = /^#[0-9a-fA-F]{6}$/.test(primaryColor);

  const simulateUpload = (id: AssetSlot) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === id
          ? {
              ...asset,
              filled: true,
              fileName: `${id}-${Date.now().toString(36)}.png`,
            }
          : asset,
      ),
    );
    setNotice(`${id} slot updated.`);
  };

  const clearAsset = (id: AssetSlot) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === id ? { ...asset, filled: false, fileName: null } : asset,
      ),
    );
    setNotice(`${id} slot cleared.`);
  };

  const saveStyle = () => {
    if (!colorValid || brandName.trim().length < 2) {
      setNotice('Fix brand name and hex color before saving.');
      return;
    }
    setSavedSnapshot({ brandName: brandName.trim(), primaryColor, radius });
    setNotice('Style tokens saved.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Brand
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Brand assets</h1>
          <p className="max-w-xl text-muted-foreground">
            Tune name, color, and corner radius. Fill logo slots and save when the draft looks
            right.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="Assets filled" value={`${filledCount}/${assets.length}`} />
          <Kpi label="Radius" value={`${radius}px`} />
          <Kpi label="Draft" value={dirty ? 'Unsaved' : 'Saved'} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette aria-hidden="true" className="h-5 w-5 text-rose-600" />
                <CardTitle className="text-base">Visual settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={nameId}>Brand name</Label>
                <Input
                  id={nameId}
                  onChange={(event) => setBrandName(event.target.value)}
                  value={brandName}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={colorId}>Primary color</Label>
                <div className="flex gap-2">
                  <input
                    aria-label="Pick primary color"
                    className="h-10 w-12 cursor-pointer rounded-md border bg-background p-1"
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    type="color"
                    value={colorValid ? primaryColor : '#2563eb'}
                  />
                  <Input
                    aria-invalid={!colorValid}
                    className="font-mono"
                    id={colorId}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    value={primaryColor}
                  />
                </div>
                {colorValid ? null : (
                  <p className="text-destructive text-xs">Use a 6-digit hex color like #2563eb.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Corner radius</Label>
                <div className="flex flex-wrap gap-1">
                  {RADIUS_OPTIONS.map((option) => (
                    <button
                      aria-pressed={radius === option.value}
                      className={cn(
                        'rounded-md border px-3 py-1.5 font-medium text-sm transition-colors',
                        radius === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      key={option.value}
                      onClick={() => setRadius(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="rounded-lg border p-4"
                style={{
                  borderRadius: radius,
                  borderColor: colorValid ? primaryColor : undefined,
                  background: colorValid ? `${primaryColor}14` : undefined,
                }}
              >
                <p
                  className="font-semibold text-sm"
                  style={{ color: colorValid ? primaryColor : undefined }}
                >
                  {brandName.trim() || 'Your brand'}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">Live preview swatch</p>
              </div>
              <Button className="w-full" disabled={!dirty} onClick={saveStyle} type="button">
                <Save aria-hidden="true" className="h-4 w-4" />
                {dirty ? 'Save style' : 'Style saved'}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="flex h-full flex-col items-center p-5 text-center">
                  <div
                    className={cn(
                      'mb-3 flex h-16 w-16 items-center justify-center border bg-muted',
                      asset.filled && 'border-dashed',
                    )}
                    style={{
                      borderRadius: radius,
                      background: asset.filled && colorValid ? `${primaryColor}22` : undefined,
                    }}
                  >
                    <ImageIcon
                      aria-hidden="true"
                      className="h-6 w-6 text-muted-foreground"
                      style={{ color: asset.filled && colorValid ? primaryColor : undefined }}
                    />
                  </div>
                  <p className="font-medium">{asset.label}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {asset.filled ? asset.fileName : asset.hint}
                  </p>
                  <div className="mt-auto flex w-full gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={() => simulateUpload(asset.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Upload aria-hidden="true" className="h-4 w-4" />
                      {asset.filled ? 'Replace' : 'Upload'}
                    </Button>
                    {asset.filled ? (
                      <Button
                        aria-label={`Clear ${asset.label}`}
                        onClick={() => clearAsset(asset.id)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <X aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — color, radius, and slots update the preview live.
              To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Wire Upload to your asset storage and replace default logo / hero / icon slots with
                the returned URLs.
              </li>
              <li>
                Persist name, primary color, and radius through the design token source (CSS vars or
                theme JSON).
              </li>
              <li>
                Keep the live preview bound to the same tokens so marketing pages stay in sync.
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
    <DemoTransitionStage defaultTransition="scale" title="Brand motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

const Kpi = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <p className="font-semibold text-lg tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </CardContent>
  </Card>
);
