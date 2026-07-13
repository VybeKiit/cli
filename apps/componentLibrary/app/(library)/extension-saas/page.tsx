import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';
import { surfaceRecipeMap } from '@library/lib/surfaceRecipeMap';

const surface = TEMPLATE_SURFACES['extension-saas'];
const surfaceRecipes = surfaceRecipeMap(surface);

/**
 * Render the extension SaaS template preview route.
 *
 * @returns The extension SaaS template surface browser.
 * @example
 * const element = <ExtensionSaasRoute />;
 */
const ExtensionSaasRoute = () => (
  <TemplateSurfaceBrowser
    activeRoute={defaultTemplateSurfaceRoute(surface)}
    recipes={surfaceRecipes}
    surface={surface}
  />
);

export default ExtensionSaasRoute;
