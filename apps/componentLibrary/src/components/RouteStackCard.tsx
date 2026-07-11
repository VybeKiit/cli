import type { TemplateSurfaceRoute } from '@library/data/templateSurfaces';
import { Route } from 'lucide-react';

interface RouteStackCardProps {
  readonly item: TemplateSurfaceRoute;
}

/**
 * One route-stack card for a template surface.
 *
 * @param props - Route stack item to display.
 * @returns A route description card.
 * @example
 * const element = <RouteStackCard item={surface.routeStack[0]} />;
 */
export const RouteStackCard = ({ item }: RouteStackCardProps) => (
  <article className="rounded-lg border bg-card p-4">
    <div className="mb-3 flex items-center gap-2">
      <Route className="h-4 w-4 text-primary" />
      <h3 className="font-semibold text-sm">{item.label}</h3>
    </div>
    <code className="rounded bg-muted px-2 py-1 text-xs">{item.route}</code>
    <p className="mt-3 text-muted-foreground text-sm">{item.description}</p>
  </article>
);
