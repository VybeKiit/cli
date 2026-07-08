import { Eye, Globe2, KeyRound, Plug, Webhook } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Connected tools',
    value: '5',
    detail: '2 need refresh',
    icon: <Plug className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'API keys',
    value: '3',
    detail: 'One expires soon',
    icon: <KeyRound className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Webhooks',
    value: '9',
    detail: 'All delivering',
    icon: <Webhook className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'OAuth apps',
    value: '2',
    detail: 'Google and GitHub',
    icon: <Globe2 className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const integrationItems = [
  {
    title: 'Connected accounts',
    description: 'OAuth providers, scopes, status, and disconnect controls.',
    badge: 'OAuth',
  },
  {
    title: 'API keys',
    description: 'Create, copy, rotate, and revoke developer keys.',
    badge: 'Keys',
  },
  {
    title: 'Webhooks',
    description: 'Delivery URL, signing secret, retries, and event filters.',
    badge: 'Hooks',
  },
] as const;

const integrationControls = [
  {
    title: 'Rotate secrets',
    description: 'Expose safe key rotation and reveal-once behavior.',
    badge: 'Security',
  },
  {
    title: 'Retry failed hooks',
    description: 'Show delivery failures and retry actions.',
    badge: 'Reliability',
  },
  {
    title: 'Limit scopes',
    description: 'Keep OAuth permissions visible before connection.',
    badge: 'Scopes',
  },
] as const;

/**
 * Render a source-backed integrations page recipe.
 *
 * @returns An integrations, API keys, and webhook management page.
 * @example
 * const element = <IntegrationsPage />;
 */
export const IntegrationsPage = () => {
  // TODO: Load connected integrations and API keys from the configured integrations source.
  // TODO: Save integration changes through audited integration actions.
  return (
    <DemoQuickWinPage
      active="integrations"
      badge="Integrations"
      detailItems={integrationControls}
      detailTitle="Integration controls"
      listDescription="A plug-and-play route for API keys, webhooks, OAuth apps, and connected tools."
      listItems={integrationItems}
      listTitle="Connected tools"
      metrics={metrics}
      primaryAction={{ label: 'Add integration', icon: <Plug className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View keys',
        icon: <Eye className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A complete integration surface covering API keys, webhooks, OAuth apps, scopes, retries, and secret rotation."
      title="Integrations"
      transition="scale"
      variantDescription="Integration pages need credential safety, delivery status, and clear connected-tool cards."
      variantItems={integrationControls}
      variantTitle="Integration component variants"
    />
  );
};
