import { PageContainer } from '@library/components/shell/PageContainer';
import { PageHeader } from '@library/components/shell/PageHeader';
import { DESIGN_SYSTEM_FAMILIES, PRIMITIVE_BY_SLUG } from '@library/data/designSystem';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Design system — VybeKiit UI',
  description:
    'The @vybekiit/ui primitives, live: every variant, size, and state for each building block.',
};

/**
 * Design-system landing: the @vybekiit/ui primitives grouped by family (ADR-0041).
 *
 * @returns The design-system surface.
 * @example
 * const element = <DesignSystemPage />;
 */
const DesignSystemPage = () => (
  <PageContainer size="default">
    <PageHeader
      description="The single source of truth every VybeKiit app is built from — each primitive shown live, with every variant, size, and state. Pick one from the sidebar, or browse by family below."
      eyebrow="@vybekiit/ui"
      title="Design system"
    />

    <div className="mt-10 space-y-10">
      {DESIGN_SYSTEM_FAMILIES.map((family) => (
        <section key={family.name}>
          <h2 className="mb-4 font-semibold text-lg">{family.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {family.primitives.map((slug) => {
              const primitive = PRIMITIVE_BY_SLUG[slug];
              if (primitive === undefined) {
                return null;
              }
              return (
                <Link
                  className="rounded-lg border p-4 transition-colors hover:border-primary"
                  href={`/design-system/${slug}`}
                  key={slug}
                >
                  <div className="font-medium">{primitive.title}</div>
                  <code className="text-muted-foreground text-xs">{primitive.importPath}</code>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {primitive.states.map((state) => (
                      <span
                        className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
                        key={state}
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  </PageContainer>
);

export default DesignSystemPage;
