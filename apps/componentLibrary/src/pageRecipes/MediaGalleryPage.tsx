'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { AlertTriangle, FileImage, ImageIcon, Loader2, Search, Upload, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type MediaKind = 'image' | 'document' | 'video';
type KindFilter = 'all' | MediaKind;

/** One media asset (mirrors file_metadata-shaped fields). */
type MediaAsset = {
  readonly id: string;
  readonly name: string;
  readonly kind: MediaKind;
  readonly sizeLabel: string;
  readonly tags: readonly string[];
  readonly alt: string | null;
  readonly dimensions: string;
  readonly uploadedAt: string;
};

const KIND_FILTERS: readonly { readonly value: KindFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Docs' },
  { value: 'video', label: 'Video' },
];

const INITIAL_ASSETS: readonly MediaAsset[] = [
  {
    id: 'med_01',
    name: 'hero-gradient.png',
    kind: 'image',
    sizeLabel: '420 KB',
    tags: ['landing', 'hero'],
    alt: 'Purple gradient backdrop for the marketing hero',
    dimensions: '1600×900',
    uploadedAt: '2d ago',
  },
  {
    id: 'med_02',
    name: 'founder-portrait.jpg',
    kind: 'image',
    sizeLabel: '1.1 MB',
    tags: ['team'],
    alt: null,
    dimensions: '800×800',
    uploadedAt: '5d ago',
  },
  {
    id: 'med_03',
    name: 'brand-guide.pdf',
    kind: 'document',
    sizeLabel: '2.4 MB',
    tags: ['brand'],
    alt: null,
    dimensions: '—',
    uploadedAt: '1w ago',
  },
  {
    id: 'med_04',
    name: 'product-demo.mp4',
    kind: 'video',
    sizeLabel: '18 MB',
    tags: ['demo', 'product'],
    alt: 'Product walkthrough with captions',
    dimensions: '1920×1080',
    uploadedAt: '3d ago',
  },
  {
    id: 'med_05',
    name: 'icon-pack-preview.png',
    kind: 'image',
    sizeLabel: '96 KB',
    tags: ['icons'],
    alt: null,
    dimensions: '512×512',
    uploadedAt: '1d ago',
  },
  {
    id: 'med_06',
    name: 'pricing-table.png',
    kind: 'image',
    sizeLabel: '210 KB',
    tags: ['landing', 'pricing'],
    alt: 'Three-tier pricing table screenshot',
    dimensions: '1200×800',
    uploadedAt: '4h ago',
  },
  {
    id: 'med_07',
    name: 'launch-checklist.md',
    kind: 'document',
    sizeLabel: '12 KB',
    tags: ['ops'],
    alt: null,
    dimensions: '—',
    uploadedAt: '2w ago',
  },
];

/**
 * A production-shaped media gallery: search/type filters, asset grid, selection preview, missing
 * alt callouts, and a simulated upload. Fully interactive with local state; plug-in panel maps to
 * `vybekiit apply-preset file_metadata`.
 *
 * @returns The media gallery recipe element.
 * @example
 * const element = <MediaGalleryPage />;
 */
export const MediaGalleryPage = () => {
  // TODO: Load media assets from the file_metadata preset via GET /api/media.
  // TODO: Persist uploads and alt/tag edits through file_metadata asset actions.
  const searchId = useId();
  const filterLabelId = useId();
  const altId = useId();

  const [assets, setAssets] = useState<readonly MediaAsset[]>(INITIAL_ASSETS);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [kind, setKind] = useState<KindFilter>('all');
  const [needsAltOnly, setNeedsAltOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_ASSETS[0]?.id ?? null);
  const [uploading, setUploading] = useState(false);
  const [altDraft, setAltDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesKind = kind === 'all' || asset.kind === kind;
      const matchesAlt = !needsAltOnly || (asset.kind === 'image' && asset.alt === null);
      const matchesQuery =
        q.length === 0 ||
        asset.name.toLowerCase().includes(q) ||
        asset.tags.some((tag) => tag.includes(q));
      return matchesKind && matchesAlt && matchesQuery;
    });
  }, [assets, debouncedQuery, kind, needsAltOnly]);

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  const kpis = useMemo(() => {
    const images = assets.filter((a) => a.kind === 'image').length;
    const missingAlt = assets.filter((a) => a.kind === 'image' && a.alt === null).length;
    return { total: assets.length, images, missingAlt };
  }, [assets]);

  const simulateUpload = () => {
    setUploading(true);
    setNotice(null);
    globalThis.setTimeout(() => {
      const next: MediaAsset = {
        id: `med_${Date.now()}`,
        name: `upload-${assets.length + 1}.png`,
        kind: 'image',
        sizeLabel: '180 KB',
        tags: ['upload'],
        alt: null,
        dimensions: '1024×768',
        uploadedAt: 'Just now',
      };
      setAssets((current) => [next, ...current]);
      setSelectedId(next.id);
      setAltDraft('');
      setUploading(false);
      setNotice(`Uploaded ${next.name}. Add alt text for accessibility.`);
      setKind('all');
      setNeedsAltOnly(false);
      setQuery('');
    }, 900);
  };

  const saveAlt = () => {
    if (selected === null) {
      return;
    }
    const nextAlt = altDraft.trim();
    setAssets((current) =>
      current.map((asset) =>
        asset.id === selected.id ? { ...asset, alt: nextAlt.length > 0 ? nextAlt : null } : asset,
      ),
    );
    setNotice(
      nextAlt.length > 0
        ? `Saved alt text for ${selected.name}.`
        : `Cleared alt text on ${selected.name}.`,
    );
  };

  // Keep alt draft in sync when selection changes.
  const selectAsset = (id: string) => {
    setSelectedId(id);
    const asset = assets.find((a) => a.id === id);
    setAltDraft(asset?.alt ?? '');
  };

  return (
    <DemoRecipeFrame defaultTransition="slide" title="Media gallery motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Media
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Media gallery</h1>
            <p className="max-w-xl text-muted-foreground">
              Browse assets, filter by type, fix missing alt text, or simulate an upload. Select a
              card to open the preview panel.
            </p>
          </div>
          <Button disabled={uploading} onClick={simulateUpload} type="button">
            {uploading ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="h-4 w-4" />
            )}
            Upload media
          </Button>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-4" variant="success">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: 'assets', label: 'Assets', value: String(kpis.total) },
              { key: 'images', label: 'Images', value: String(kpis.images) },
              {
                key: 'missing-alt',
                label: 'Missing alt',
                value: String(kpis.missingAlt),
                valueClassName: kpis.missingAlt > 0 ? 'text-amber-600' : undefined,
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm" id={filterLabelId}>
            Type
          </span>
          <SegmentedControl
            aria-labelledby={filterLabelId}
            onValueChange={(value) => setKind(value as typeof kind)}
            value={kind}
          >
            {KIND_FILTERS.map((option) => (
              <SegmentedControlItem key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <Button
            aria-pressed={needsAltOnly}
            onClick={() => setNeedsAltOnly((v) => !v)}
            size="sm"
            type="button"
            variant={needsAltOnly ? 'secondary' : 'outline'}
          >
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> Needs alt
          </Button>
          <div className="relative ml-auto w-full sm:w-56">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or tag…"
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardContent className="p-3 sm:p-4">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-16 text-center">
                  <ImageIcon aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                  <h2 className="mt-3 font-semibold">No assets match</h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Clear filters or upload a new file.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setQuery('');
                      setKind('all');
                      setNeedsAltOnly(false);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visible.map((asset) => {
                    const active = selectedId === asset.id;
                    const missingAlt = asset.kind === 'image' && asset.alt === null;
                    return (
                      <li key={asset.id}>
                        <button
                          aria-pressed={active}
                          className={cn(
                            'flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors',
                            active
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'hover:border-foreground/20',
                          )}
                          onClick={() => selectAsset(asset.id)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-24 items-center justify-center bg-muted text-muted-foreground"
                          >
                            {asset.kind === 'image' ? (
                              <ImageIcon className="h-8 w-8" />
                            ) : (
                              <FileImage className="h-8 w-8" />
                            )}
                          </span>
                          <span className="space-y-1 p-2">
                            <span className="block truncate font-medium text-xs">{asset.name}</span>
                            <span className="flex flex-wrap items-center gap-1">
                              <Badge className="font-normal text-[10px]" variant="outline">
                                {asset.kind}
                              </Badge>
                              {missingAlt ? (
                                <Badge
                                  className="border-amber-500/40 bg-amber-500/10 font-normal text-[10px] text-amber-600"
                                  variant="outline"
                                >
                                  No alt
                                </Badge>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">Preview</CardTitle>
              {selected ? (
                <Button
                  aria-label="Clear selection"
                  onClick={() => setSelectedId(null)}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {selected === null ? (
                <p className="text-muted-foreground text-sm">
                  Select an asset to preview metadata.
                </p>
              ) : (
                <div className="space-y-3">
                  <div
                    aria-hidden="true"
                    className="flex h-36 items-center justify-center rounded-md bg-muted text-muted-foreground"
                  >
                    <ImageIcon className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selected.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {selected.sizeLabel} · {selected.dimensions} · {selected.uploadedAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selected.kind === 'image' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={altId}>Alt text</Label>
                      <Input
                        id={altId}
                        onChange={(event) => setAltDraft(event.target.value)}
                        placeholder="Describe the image for screen readers"
                        value={altDraft}
                      />
                      <Button onClick={saveAlt} size="sm" type="button" variant="outline">
                        Save alt
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — filters, upload, selection, and alt edits all
            recompute the gallery. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset file_metadata</code> for the{' '}
              <code>file_metadata</code> table (bucket, key, content_type, size_bytes).
            </li>
            <li>
              Upload to object storage (R2 / S3), then <code>POST /api/media</code> inserts the
              metadata row.
            </li>
            <li>
              <code>GET /api/media?kind=&amp;q=</code> lists assets; store alt/tags in metadata JSON
              or extra columns.
            </li>
            <li>
              Surface images with empty alt in an accessibility queue (the “Needs alt” filter).
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
