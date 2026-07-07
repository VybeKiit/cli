import { PageRecipeBrowser } from '@library/components/PageRecipeBrowser';

interface PagesRouteProps {
  readonly searchParams: Promise<{ group?: string }>;
}

/**
 * Render the Page recipe catalog route.
 *
 * @param props - Props passed to this route.
 * @returns The Page recipe browser page.
 * @example
 * const element = await PagesRoute({ searchParams: Promise.resolve({ group: 'payments' }) });
 */
const PagesRoute = async ({ searchParams }: PagesRouteProps) => {
  const { group } = await searchParams;
  return <PageRecipeBrowser initialGroupId={group} />;
};

export default PagesRoute;
