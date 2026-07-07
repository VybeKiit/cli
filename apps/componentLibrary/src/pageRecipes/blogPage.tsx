import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ArrowRight } from 'lucide-react';

/**
 * Render a source-backed blog page recipe.
 *
 * @returns A ready article index page component.
 * @example
 * const element = <BlogPage />;
 */
export const BlogPage = () => {
  // TODO: Load published posts from the configured CMS or markdown content source.
  // TODO: Connect article cards to real blog routes.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <Badge className="mb-4" variant="secondary">
          Blog
        </Badge>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">Latest updates</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              A starter publishing page for articles, changelogs, or product stories.
            </p>
          </div>
          <Button type="button" variant="outline">
            New article
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Launch note', 'Product story', 'Customer guide'].map((title) => (
            <article className="rounded-lg border bg-card p-5" key={title}>
              <p className="text-muted-foreground text-sm">Default article</p>
              <h2 className="mt-2 font-semibold text-xl">{title}</h2>
              <p className="mt-3 text-muted-foreground text-sm">
                Replace this card with content from your publishing source.
              </p>
              <Button className="mt-4 px-0" type="button" variant="link">
                Read more
                <ArrowRight className="h-4 w-4" />
              </Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
