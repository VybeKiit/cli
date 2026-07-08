import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ExtensionSaasItem,
  ExtensionSaasScreen as ExtensionSaasScreenDefinition,
} from '@/data/saasScreens';

export interface ExtensionSaasScreenProps {
  readonly screen: ExtensionSaasScreenDefinition;
}

/**
 * Render one side-panel SaaS screen.
 *
 * @param props - Screen definition selected by the extension router.
 * @returns A compact SaaS screen for the Chrome side panel.
 * @example
 * <ExtensionSaasScreen screen={screen} />
 */
export const ExtensionSaasScreen = ({ screen }: ExtensionSaasScreenProps) => (
  <div className="flex flex-col gap-4">
    <header className="space-y-3">
      <Badge variant="outline">{screen.eyebrow}</Badge>
      <div className="space-y-2">
        <h1 className="font-bold text-2xl tracking-tight">{screen.title}</h1>
        <p className="text-muted-foreground text-sm">{screen.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button">
          <span aria-hidden="true">+</span>
          {screen.primaryLabel}
        </Button>
        <Button type="button" variant="outline">
          <span aria-hidden="true">&gt;</span>
          {screen.secondaryLabel}
        </Button>
      </div>
    </header>

    <section className="grid grid-cols-1 gap-2">
      {screen.metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="p-4">
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
            <CardDescription>{metric.detail}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>

    <Card>
      <CardHeader className="p-4">
        <CardTitle>{screen.title}</CardTitle>
        <CardDescription>Route objects and visible states.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        {screen.items.map((item) => (
          <ExtensionSaasItemRow item={item} key={item.title} />
        ))}
      </CardContent>
    </Card>
  </div>
);

interface ExtensionSaasItemRowProps {
  readonly item: ExtensionSaasItem;
}

/**
 * Render one compact extension SaaS item row.
 *
 * @param props - Item row definition.
 * @returns A side-panel row with title, description, and metadata.
 * @example
 * <ExtensionSaasItemRow item={item} />
 */
const ExtensionSaasItemRow = ({ item }: ExtensionSaasItemRowProps) => (
  <div className="rounded-lg border p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="font-medium text-sm">{item.title}</p>
        <p className="text-muted-foreground text-xs">{item.description}</p>
      </div>
      <Badge variant="outline" className="shrink-0">
        {item.meta}
      </Badge>
    </div>
  </div>
);
