'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { FileText, FolderOpen, ImageIcon, Search, Trash2, UploadCloud } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type FileType = 'pdf' | 'image' | 'text' | 'other';
type TypeFilter = 'all' | FileType;

/** One file metadata row (mirrors the file_metadata preset). */
type ManagedFile = {
  readonly id: string;
  readonly name: string;
  readonly type: FileType;
  readonly sizeLabel: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string;
};

const INITIAL_FILES: readonly ManagedFile[] = [
  {
    id: 'file_01',
    name: 'brand-guide.pdf',
    type: 'pdf',
    sizeLabel: '2.4 MB',
    sizeBytes: 2_400_000,
    uploadedAt: '2d ago',
  },
  {
    id: 'file_02',
    name: 'hero-image.png',
    type: 'image',
    sizeLabel: '860 KB',
    sizeBytes: 860_000,
    uploadedAt: '5h ago',
  },
  {
    id: 'file_03',
    name: 'launch-copy.md',
    type: 'text',
    sizeLabel: '18 KB',
    sizeBytes: 18_000,
    uploadedAt: 'Yesterday',
  },
  {
    id: 'file_04',
    name: 'pricing-sheet.pdf',
    type: 'pdf',
    sizeLabel: '420 KB',
    sizeBytes: 420_000,
    uploadedAt: '1w ago',
  },
  {
    id: 'file_05',
    name: 'team-photo.jpg',
    type: 'image',
    sizeLabel: '1.1 MB',
    sizeBytes: 1_100_000,
    uploadedAt: '3d ago',
  },
];

const TYPE_FILTERS: readonly { readonly value: TypeFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'text', label: 'Text' },
  { value: 'other', label: 'Other' },
];

const TYPE_ICON: Record<FileType, ReactNode> = {
  pdf: <FileText aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
  image: <ImageIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
  text: <FileText aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
  other: <FolderOpen aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1_048_576) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

/**
 * Interactive file manager: search, type filter, simulated upload, delete, empty states.
 * Plug-in panel maps onto the file_metadata preset.
 *
 * @returns The file manager recipe element.
 * @example
 * const element = <FileManagerPage />;
 */
export const FileManagerPage = () => {
  // TODO: Connect file selection to the configured upload provider.
  // TODO: Save uploaded file metadata through the file metadata preset.
  const searchId = useId();
  const fileInputId = useId();

  const [files, setFiles] = useState<readonly ManagedFile[]>(INITIAL_FILES);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((file) => {
      if (typeFilter !== 'all' && file.type !== typeFilter) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return file.name.toLowerCase().includes(q);
    });
  }, [files, query, typeFilter]);

  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
  const selected = files.find((file) => file.id === selectedId) ?? null;

  const guessType = (name: string): FileType => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return 'pdf';
    }
    if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) {
      return 'image';
    }
    if (/\.(md|txt|csv|json)$/.test(lower)) {
      return 'text';
    }
    return 'other';
  };

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) {
      return;
    }
    setUploading(true);
    const next: ManagedFile[] = Array.from(list).map((file, index) => ({
      id: `file_${Date.now()}_${index}`,
      name: file.name,
      type: guessType(file.name),
      sizeLabel: formatBytes(file.size),
      sizeBytes: file.size,
      uploadedAt: 'Just now',
    }));
    globalThis.setTimeout(() => {
      setFiles((current) => [...next, ...current]);
      setUploading(false);
      setNotice(`Uploaded ${next.length} file${next.length === 1 ? '' : 's'}.`);
      setTypeFilter('all');
      setQuery('');
    }, 650);
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
    setNotice('File removed.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Files
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">
            Upload and organize files
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Drop files in, filter by type, and delete rows. Metadata stays local until you wire the
            preset.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="Files" value={String(files.length)} />
          <Kpi label="Storage" value={formatBytes(totalBytes)} />
          <Kpi label="Visible" value={String(visible.length)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <UploadCloud aria-hidden="true" className="h-10 w-10 text-blue-600" />
                <h2 className="mt-3 font-semibold text-lg">Drop files here</h2>
                <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                  Or pick from disk. Demo mode keeps files in memory only.
                </p>
                <label
                  className={cn(
                    'mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm',
                    uploading && 'pointer-events-none opacity-70',
                  )}
                  htmlFor={fileInputId}
                >
                  <UploadCloud aria-hidden="true" className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Choose files'}
                </label>
                <Input
                  accept="*/*"
                  className="sr-only"
                  id={fileInputId}
                  multiple={true}
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = '';
                  }}
                  type="file"
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search files"
                  className="pl-8"
                  id={searchId}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search files…"
                  value={query}
                />
              </div>
              <div className="flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
                {TYPE_FILTERS.map((option) => (
                  <button
                    aria-pressed={typeFilter === option.value}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 font-medium text-xs transition-colors sm:text-sm',
                      typeFilter === option.value
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={option.value}
                    onClick={() => setTypeFilter(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-2 sm:p-3">
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-14 text-center">
                    <FolderOpen aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                    <h2 className="mt-3 font-semibold">
                      {files.length === 0 ? 'No files yet' : 'No files match'}
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {files.length === 0
                        ? 'Upload something above to get started.'
                        : 'Try another search or type filter.'}
                    </p>
                    {files.length === 0 ? null : (
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setQuery('');
                          setTypeFilter('all');
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <ul aria-label="File list" className="divide-y">
                    {visible.map((file) => (
                      <li key={file.id}>
                        <button
                          className={cn(
                            'flex w-full items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-muted/50',
                            selectedId === file.id && 'bg-primary/5',
                          )}
                          onClick={() => setSelectedId(file.id)}
                          type="button"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            {TYPE_ICON[file.type]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {file.type.toUpperCase()} · {file.sizeLabel} · {file.uploadedAt}
                            </p>
                          </div>
                          <Button
                            aria-label={`Delete ${file.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeFile(file.id);
                            }}
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen aria-hidden="true" className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium break-all">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-medium capitalize">{selected.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Size</p>
                    <p className="font-medium">{selected.sizeLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Uploaded</p>
                    <p className="font-medium">{selected.uploadedAt}</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => removeFile(selected.id)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete file
                  </Button>
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Select a file to inspect metadata.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — upload, search, type filter, and delete recompute
              the list. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Connect file selection to the configured upload provider (R2 / S3 / Supabase
                storage).
              </li>
              <li>
                Run <code>vybekiit apply-preset file_metadata</code> and save{' '}
                <code>{'{ name, mime, size_bytes, url, owner_id }'}</code> after upload.
              </li>
              <li>
                <code>GET /api/files?type=&amp;q=</code> loads the list; delete →{' '}
                <code>DELETE /api/files/:id</code> plus storage object removal.
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
    <DemoTransitionStage defaultTransition="slide" title="Files motion pass">
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
