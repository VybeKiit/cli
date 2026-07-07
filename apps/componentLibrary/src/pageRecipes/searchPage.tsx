import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Search } from 'lucide-react';

/**
 * Render a source-backed search page recipe.
 *
 * @returns A ready search page component for indexed app content.
 * @example
 * const element = <SearchPage />;
 */
export const SearchPage = () => {
  // TODO: Connect the search input to the configured search provider.
  // TODO: Replace default result labels with records from the search index.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <Badge className="mb-4" variant="secondary">
          Search
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Find anything in your app</h1>
        <div className="mt-6 flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" defaultValue="orders this week" />
          </div>
          <Button type="button">Search</Button>
        </div>
        <div className="mt-6 grid gap-3">
          {['Best match', 'Recent update', 'Saved item'].map((label) => (
            <article className="rounded-lg border bg-card p-4" key={label}>
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Default result row. Connect this to indexed records before launch.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
