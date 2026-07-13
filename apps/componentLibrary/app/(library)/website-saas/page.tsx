import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';
import { surfaceRecipeMap } from '@library/lib/surfaceRecipeMap';

const surface = TEMPLATE_SURFACES['website-saas'];
const surfaceRecipes = surfaceRecipeMap(surface);

/**
 * Render the website SaaS template preview route.
 *
 * @returns The website SaaS template surface browser.
 * @example
 * const element = <WebsiteSaasRoute />;
 */
const WebsiteSaasRoute = () => (
  <TemplateSurfaceBrowser
    activeRoute={defaultTemplateSurfaceRoute(surface)}
    recipes={surfaceRecipes}
    surface={surface}
  />
);

export default WebsiteSaasRoute;
