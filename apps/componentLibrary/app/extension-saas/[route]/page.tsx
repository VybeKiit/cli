import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { TEMPLATE_SURFACES, templateSurfaceRouteByPath } from '@library/data/templateSurfaces';
import { notFound } from 'next/navigation';

const surface = TEMPLATE_SURFACES['extension-saas'];

interface ExtensionSaasNestedRouteProps {
  readonly params: Promise<{
    readonly route: string;
  }>;
}

/**
 * Generate static route params for extension SaaS nested preview routes.
 *
 * @returns Static params for every extension SaaS route.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => surface.appRoutes.map((route) => ({ route: route.path }));

/**
 * Render a nested extension SaaS preview route.
 *
 * @param props - Route params supplied by Next.js.
 * @returns The extension SaaS preview at the requested nested route.
 * @example
 * const element = await ExtensionSaasNestedRoute({ params });
 */
const ExtensionSaasNestedRoute = async ({ params }: ExtensionSaasNestedRouteProps) => {
  const { route: routePath } = await params;
  const route = templateSurfaceRouteByPath(surface, routePath);

  if (route === undefined) {
    notFound();
  }

  return <TemplateSurfaceBrowser activeRoute={route} surface={surface} />;
};

export default ExtensionSaasNestedRoute;
