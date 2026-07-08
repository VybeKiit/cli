import { Badge } from '@vybekiit/ui/badge';
import { Input } from '@vybekiit/ui/input';
import { Palette, Save } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';

/**
 * Render a source-backed brand assets page recipe.
 *
 * @returns A ready image, logo, and color setup page component.
 * @example
 * const element = <BrandAssetsPage />;
 */
export const BrandAssetsPage = () => {
  // TODO: Replace default logo and image slots with uploaded brand assets.
  // TODO: Save color and shape choices through the design token source.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <Badge className="mb-4" variant="secondary">
          Brand
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Brand assets</h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border bg-card p-5">
            <Palette className="mb-4 h-6 w-6 text-rose-600" />
            <h2 className="font-semibold text-xl">Visual settings</h2>
            <div className="mt-4 space-y-3">
              <Input defaultValue="VybeKiit" />
              <Input defaultValue="#2563eb" />
              <DemoActionButton className="w-full" icon={<Save className="h-4 w-4" />}>
                Save style
              </DemoActionButton>
            </div>
          </aside>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Logo', 'Hero image', 'App icon'].map((label) => (
              <div className="rounded-lg border bg-card p-5 text-center" key={label}>
                <div className="mx-auto mb-3 h-16 w-16 rounded-lg bg-muted" />
                <p className="font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
