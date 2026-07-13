import { PrimitiveStory } from '@library/components/PrimitiveStory';
import { PageContainer } from '@library/components/shell/PageContainer';
import { DESIGN_SYSTEM_PRIMITIVES, PRIMITIVE_BY_SLUG } from '@library/data/designSystem';
import { componentStateMeta } from '@library/lib/componentStates';
import { designSystemSiblings } from '@library/lib/designSystemNav';
import { Badge } from '@vybekiit/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface DesignSystemRouteProps {
  readonly params: Promise<{
    readonly slug: string;
  }>;
}

/**
 * Generate a static route for every primitive in the design-system index.
 *
 * @returns Static params for each primitive slug.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () =>
  DESIGN_SYSTEM_PRIMITIVES.map((primitive) => ({ slug: primitive.slug }));

/**
 * Sectioned primitive story: live playground, states, props/API, and usage (ADR-0041).
 *
 * @param props - Route props supplied by Next.js.
 * @returns The primitive detail page.
 * @example
 * const element = await DesignSystemRoute({ params });
 */
const DesignSystemRoute = async ({ params }: DesignSystemRouteProps) => {
  const { slug } = await params;
  const primitive = PRIMITIVE_BY_SLUG[slug];

  if (primitive === undefined) {
    notFound();
  }

  const usage = `import { ${primitive.exportName} } from '${primitive.importPath}';`;
  const { prev, next } = designSystemSiblings(slug);

  return (
    <PageContainer size="default">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/design-system">
          Design system
        </Link>
        <ChevronRight className="size-3.5 opacity-60" />
        <span>{primitive.family}</span>
        <ChevronRight className="size-3.5 opacity-60" />
        <span className="text-foreground">{primitive.title}</span>
      </nav>

      <header className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {primitive.family}
          </span>
          {primitive.hasOverride ? <Badge variant="secondary">Live override</Badge> : null}
        </div>
        <h1 className="mt-1 font-bold text-3xl">{primitive.title}</h1>
        <code className="mt-3 block w-fit rounded bg-muted px-2 py-1 font-mono text-sm">
          {usage}
        </code>
      </header>

      <section aria-label="Live playground">
        <PrimitiveStory descriptor={primitive} />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-semibold text-lg">States</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {primitive.states.map((state) => {
            const meta = componentStateMeta(state);
            return (
              <div className="rounded-lg border p-3" key={state}>
                <Badge variant="outline">{meta.label}</Badge>
                <p className="mt-2 text-muted-foreground text-sm">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-semibold text-lg">Props</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {primitive.props.map((prop) => (
                <TableRow key={prop.name}>
                  <TableCell className="font-medium font-mono">{prop.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {prop.type}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {prop.defaultValue ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-muted-foreground text-xs">
          Variant and size props are derived from the primitive&rsquo;s <code>cva</code> config, so
          this table can never drift from source.
        </p>
      </section>

      <nav
        aria-label="Primitive pagination"
        className="mt-14 flex items-center justify-between gap-4 border-t pt-6"
      >
        {prev ? (
          <Link className="group flex flex-col" href={`/design-system/${prev.slug}`}>
            <span className="text-muted-foreground text-xs">← Previous</span>
            <span className="font-medium text-sm group-hover:text-primary">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="group flex flex-col text-end" href={`/design-system/${next.slug}`}>
            <span className="text-muted-foreground text-xs">Next →</span>
            <span className="font-medium text-sm group-hover:text-primary">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </PageContainer>
  );
};

export default DesignSystemRoute;
