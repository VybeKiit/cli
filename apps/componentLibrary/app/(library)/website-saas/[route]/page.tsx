import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { TEMPLATE_SURFACES, templateSurfaceRouteByPath } from '@library/data/templateSurfaces';
import { surfaceRecipeMap } from '@library/lib/surfaceRecipeMap';
import { notFound } from 'next/navigation';

const surface = TEMPLATE_SURFACES['website-saas'];
const surfaceRecipes = surfaceRecipeMap(surface);

interface WebsiteSaasNestedRouteProps {
  readonly params: Promise<{
    readonly route: string;
  }>;
}

/**
 * Generate static route params for website SaaS nested preview routes.
 *
 * @returns Static params for every website SaaS route.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => surface.appRoutes.map((route) => ({ route: route.path }));

/**
 * Render a nested website SaaS preview route.
 *
 * @param props - Route params supplied by Next.js.
 * @returns The website SaaS preview at the requested nested route.
 * @example
 * const element = await WebsiteSaasNestedRoute({ params });
 */
const WebsiteSaasNestedRoute = async ({ params }: WebsiteSaasNestedRouteProps) => {
  const { route: routePath } = await params;
  const route = templateSurfaceRouteByPath(surface, routePath);

  if (route === undefined) {
    notFound();
  }

  return <TemplateSurfaceBrowser activeRoute={route} recipes={surfaceRecipes} surface={surface} />;
};

export default WebsiteSaasNestedRoute;
