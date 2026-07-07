import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Languages } from 'lucide-react';

/**
 * Render a source-backed language page recipe.
 *
 * @returns A ready translation management page component.
 * @example
 * const element = <LanguagePage />;
 */
export const LanguagePage = () => {
  // TODO: Connect locale choices to the configured i18n routing source.
  // TODO: Replace default strings with translated message files.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl rounded-lg border bg-card p-6">
        <Badge className="mb-4" variant="secondary">
          Languages
        </Badge>
        <Languages className="mb-4 h-8 w-8 text-blue-600" />
        <h1 className="font-bold text-4xl tracking-tight">Translate your app</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Input defaultValue="English" />
            <Input defaultValue="Hebrew" />
            <Input defaultValue="Spanish" />
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Preview phrase</p>
            <p className="mt-2 text-muted-foreground">Welcome to your dashboard.</p>
            <Button className="mt-4" type="button">
              Save translations
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};
