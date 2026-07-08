import { TemplateSurfaceBrowser } from '@library/components/TemplateSurfaceBrowser';
import { defaultTemplateSurfaceRoute, TEMPLATE_SURFACES } from '@library/data/templateSurfaces';

const surface = TEMPLATE_SURFACES['website-saas'];

/**
 * Render the website SaaS template preview route.
 *
 * @returns The website SaaS template surface browser.
 * @example
 * const element = <WebsiteSaasRoute />;
 */
const WebsiteSaasRoute = () => (
  <TemplateSurfaceBrowser activeRoute={defaultTemplateSurfaceRoute(surface)} surface={surface} />
);

export default WebsiteSaasRoute;
