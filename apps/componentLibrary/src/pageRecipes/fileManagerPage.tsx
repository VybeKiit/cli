import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { UploadCloud } from 'lucide-react';

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
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-4xl">
        <Badge className="mb-4" variant="secondary">
          Files
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Upload and organize files</h1>
        <div className="mt-6 rounded-lg border border-dashed bg-card p-8 text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-blue-600" />
          <h2 className="mt-4 font-semibold text-xl">Drop files here</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
            This recipe uses default labels until an upload provider is connected.
          </p>
          <div className="mx-auto mt-5 max-w-sm">
            <Input type="file" />
          </div>
          <Button className="mt-4" type="button">
            Upload file
          </Button>
        </div>
      </section>
    </main>
  );
};
