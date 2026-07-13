import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderBackLink {
  readonly href: string;
  readonly label: string;
}

interface PageHeaderProps {
  readonly title: ReactNode;
  readonly eyebrow?: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly backLink?: PageHeaderBackLink;
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * The shared library page header: an optional back-link, an eyebrow, the title, a description, and a
 * right-aligned actions slot — so every section opens with the same rhythm. Pass extra content (a
 * usage snippet, state badges) as `children`; it renders directly under the description.
 *
 * @param props - Header content slots.
 * @returns The page header block.
 * @example
 * const element = <PageHeader eyebrow="VybeKiit" title="Component Library" description="…" />;
 */
export const PageHeader = ({
  title,
  eyebrow,
  description,
  actions,
  backLink,
  children,
  className,
}: PageHeaderProps) => (
  <header className={cn('mb-8', className)}>
    {backLink ? (
      <Link
        className="mb-4 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
        href={backLink.href}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLink.label}
      </Link>
    ) : null}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 flex flex-wrap items-center gap-2 font-medium text-muted-foreground text-sm">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  </header>
);
