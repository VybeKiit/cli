/** Visual icon keys supported by the SaaS page renderer. */
type SaasIconName =
  | 'activity'
  | 'archive'
  | 'bell'
  | 'calendar'
  | 'cart'
  | 'check'
  | 'credit-card'
  | 'file'
  | 'kanban'
  | 'life-buoy'
  | 'package'
  | 'plug'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'users';

/** One metric card shown at the top of a SaaS page. */
interface SaasMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: SaasIconName;
}

/** One content item rendered in a page section. */
interface SaasPageItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
}

/** One command button rendered on a SaaS page. */
interface SaasPageAction {
  readonly label: string;
  readonly icon: SaasIconName;
  readonly variant: 'default' | 'outline' | 'secondary';
}

/** One public or signed-in SaaS route definition. */
interface SaasPageDefinition {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly primaryAction: SaasPageAction;
  readonly secondaryAction: SaasPageAction;
  readonly metrics: readonly SaasMetric[];
  readonly mainItems: readonly SaasPageItem[];
  readonly asideItems: readonly SaasPageItem[];
}

export type { SaasIconName, SaasMetric, SaasPageAction, SaasPageDefinition, SaasPageItem };
