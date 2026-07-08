import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';

const surface = TEMPLATE_SURFACES['mobile-saas'];

/**
 * Render the mobile SaaS template preview route.
 *
 * @returns The mobile SaaS template surface browser.
 * @example
 * const element = <MobileSaasRoute />;
 */
const MobileSaasRoute = () => (
  <TemplateSurfaceBrowser activeRoute={defaultTemplateSurfaceRoute(surface)} surface={surface} />
);

export default MobileSaasRoute;
