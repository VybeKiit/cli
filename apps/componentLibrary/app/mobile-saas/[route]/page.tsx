import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { TEMPLATE_SURFACES, templateSurfaceRouteByPath } from '@library/data/templateSurfaces';
import { notFound } from 'next/navigation';

const surface = TEMPLATE_SURFACES['mobile-saas'];

interface MobileSaasNestedRouteProps {
  readonly params: Promise<{
    readonly route: string;
  }>;
}

/**
 * Generate static route params for mobile SaaS nested preview routes.
 *
 * @returns Static params for every mobile SaaS route.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => surface.appRoutes.map((route) => ({ route: route.path }));

/**
 * Render a nested mobile SaaS preview route.
 *
 * @param props - Route params supplied by Next.js.
 * @returns The mobile SaaS preview at the requested nested route.
 * @example
 * const element = await MobileSaasNestedRoute({ params });
 */
const MobileSaasNestedRoute = async ({ params }: MobileSaasNestedRouteProps) => {
  const { route: routePath } = await params;
  const route = templateSurfaceRouteByPath(surface, routePath);

  if (route === undefined) {
    notFound();
  }

  return <TemplateSurfaceBrowser activeRoute={route} surface={surface} />;
};

export default MobileSaasNestedRoute;
