import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';

const surface = TEMPLATE_SURFACES['extension-saas'];

/**
 * Render the extension SaaS template preview route.
 *
 * @returns The extension SaaS template surface browser.
 * @example
 * const element = <ExtensionSaasRoute />;
 */
const ExtensionSaasRoute = () => (
  <TemplateSurfaceBrowser activeRoute={defaultTemplateSurfaceRoute(surface)} surface={surface} />
);

export default ExtensionSaasRoute;
