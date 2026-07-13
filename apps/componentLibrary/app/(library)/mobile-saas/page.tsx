import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';
import { surfaceRecipeMap } from '@library/lib/surfaceRecipeMap';

const surface = TEMPLATE_SURFACES['mobile-saas'];
const surfaceRecipes = surfaceRecipeMap(surface);

/**
 * Render the mobile SaaS template preview route.
 *
 * @returns The mobile SaaS template surface browser.
 * @example
 * const element = <MobileSaasRoute />;
 */
const MobileSaasRoute = () => (
  <TemplateSurfaceBrowser
    activeRoute={defaultTemplateSurfaceRoute(surface)}
    recipes={surfaceRecipes}
    surface={surface}
  />
);

export default MobileSaasRoute;
