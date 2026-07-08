import { Badge } from '@vybekiit/ui/badge';
import { Input } from '@vybekiit/ui/input';
import { FileText, FolderOpen, ImageIcon, UploadCloud } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoAppShell } from './shared/DemoAppShell';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const files = [
  { name: 'brand-guide.pdf', type: 'PDF', size: '2.4 MB' },
  { name: 'hero-image.png', type: 'Image', size: '860 KB' },
  { name: 'launch-copy.md', type: 'Text', size: '18 KB' },
];

/**
 * Render a source-backed file manager page recipe.
 *
 * @returns A ready file upload page component.
 * @example
 * const element = <FileManagerPage />;
 */
export const FileManagerPage = () => {
  // TODO: Connect file selection to the configured upload provider.
  // TODO: Save uploaded file metadata through the file metadata preset.
  return (
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="slide" title="Files motion pass">
        <DemoAppShell active="files" title="Upload and organize files">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-dashed bg-card p-8 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-blue-600" />
              <Badge className="mt-4" variant="secondary">
                Files
              </Badge>
              <h2 className="mt-4 font-semibold text-xl">Drop files here</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
                This recipe uses default labels until an upload provider is connected.
              </p>
              <div className="mx-auto mt-5 max-w-sm">
                <Input type="file" />
              </div>
              <DemoActionButton className="mt-4" icon={<UploadCloud className="h-4 w-4" />}>
                Upload file
              </DemoActionButton>
            </div>

            <aside className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Recent files</h2>
              </div>
              <div className="mt-4 space-y-3">
                {files.map((file) => (
                  <div className="rounded-lg border p-3" key={file.name}>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{file.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {file.type} · {file.size}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <DemoVariantGrid
            className="mt-6"
            description="Upload states should stay readable across dense and visual file cards."
            title="File component variants"
          >
            <DemoVariantCard label="Image card" tone="accent">
              <ImageIcon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold">hero-image.png</p>
              <p className="text-muted-foreground text-sm">Large visual file row.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Document card" tone="muted">
              <FileText className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium text-sm">brand-guide.pdf</p>
              <p className="text-muted-foreground text-xs">Compact metadata row.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Upload action" tone="primary">
              <UploadCloud className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">1s simulated upload</p>
              <p className="text-muted-foreground text-sm">Button state mirrors API handoff.</p>
            </DemoVariantCard>
          </DemoVariantGrid>
        </DemoAppShell>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
