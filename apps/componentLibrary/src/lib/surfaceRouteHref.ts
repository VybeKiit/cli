import type { TemplateSurface, TemplateSurfaceAppRoute } from '@library/data/templateSurfaces';

/**
 * Build the nested route href for a template surface route.
 *
 * @param surface - Template surface metadata.
 * @param route - App route metadata.
 * @returns URL path for the nested route.
 * @example
 * const href = surfaceRouteHref(surface, route);
 */
export const surfaceRouteHref = (
  surface: TemplateSurface,
  route: TemplateSurfaceAppRoute,
): string => `${surface.href}/${route.path}`;
