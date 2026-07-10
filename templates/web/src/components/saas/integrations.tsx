'use client';

import { IntegrationTodo } from '@/components/saas/integrationTodo';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Switch } from '@vybekiit/ui/switch';
import { Activity, KeyRound, Plug, Webhook } from 'lucide-react';
import { useState } from 'react';

type IntegrationId = 'stripe' | 'resend' | 'posthog' | 'github' | 'slack';

type IntegrationRow = {
  readonly id: IntegrationId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly connected: boolean;
};

const INITIAL: readonly IntegrationRow[] = [
  {
    id: 'stripe',
    name: 'Payments',
    description: 'Checkout, invoices, and subscriptions.',
    category: 'Billing',
    connected: true,
  },
  {
    id: 'resend',
    name: 'Email',
    description: 'Transactional receipts and sign-in codes.',
    category: 'Comms',
    connected: false,
  },
  {
    id: 'posthog',
    name: 'Analytics',
    description: 'Product events and funnels.',
    category: 'Insights',
    connected: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repo invites and backup.',
    category: 'Dev',
    connected: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Ops alerts and support pings.',
    category: 'Comms',
    connected: false,
  },
];

/**
 * Integrations hub with connect toggles, webhook test, and API key practice actions.
 *
 * @returns The integrations dashboard page.
 * @example
 * <IntegrationsPage />
 */
export const IntegrationsPage = () => {
  const [rows, setRows] = useState<readonly IntegrationRow[]>(INITIAL);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [apiKeyFlash, setApiKeyFlash] = useState('');

  const connectedCount = rows.filter((row) => row.connected).length;

  const toggle = (id: IntegrationId) => {
    // TODO(vybekiit): persist connection state per provider env / OAuth
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, connected: !row.connected } : row)),
    );
  };

  const testWebhook = () => {
    setWebhookStatus('testing');
    // TODO(vybekiit): POST sample event to configured webhook endpoint
    globalThis.setTimeout(() => setWebhookStatus('ok'), 700);
  };

  const createApiKey = () => {
    // TODO(vybekiit): mint API key via backend route
    setApiKeyFlash('vk_test_••••••••••••4f2a (practice key — copy once)');
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect tools, rotate API keys, and verify webhook delivery.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connected</CardDescription>
            <CardTitle className="text-3xl">{connectedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Active tools</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Webhooks</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Webhook aria-hidden="true" className="h-6 w-6" />
              {webhookStatus === 'ok' ? 'OK' : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              disabled={webhookStatus === 'testing'}
              onClick={testWebhook}
              size="sm"
              type="button"
              variant="outline"
            >
              {webhookStatus === 'testing' ? 'Testing…' : 'Test webhook'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API keys</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound aria-hidden="true" className="h-5 w-5" /> Create
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={createApiKey} size="sm" type="button">
              New practice key
            </Button>
            {apiKeyFlash ? <p className="font-mono text-xs">{apiKeyFlash}</p> : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug aria-hidden="true" className="h-5 w-5" /> Available connections
          </CardTitle>
          <CardDescription>
            Toggle connections in practice mode until OAuth is wired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={row.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.name}</p>
                  <Badge variant="outline">{row.category}</Badge>
                  <Badge variant={row.connected ? 'default' : 'secondary'}>
                    {row.connected ? 'Connected' : 'Off'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{row.description}</p>
              </div>
              <Switch
                aria-label={`Toggle ${row.name}`}
                checked={row.connected}
                onCheckedChange={() => toggle(row.id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity aria-hidden="true" className="h-4 w-4" /> Delivery log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between rounded-md border p-3">
            <span>checkout.completed</span>
            <Badge variant="outline">2m ago</Badge>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>user.created</span>
            <Badge variant="outline">18m ago</Badge>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>webhook.test</span>
            <Badge variant="outline">{webhookStatus === 'ok' ? 'just now' : 'not run'}</Badge>
          </div>
        </CardContent>
      </Card>

      <IntegrationTodo
        feature="integrations"
        todos={[
          'Gate each toggle on the matching skill (setup-payments, setup-email, add-analytics).',
          'Store API keys hashed server-side; never show full secrets after create.',
          'Replay webhook_events preset rows for the delivery log.',
        ]}
      />
    </div>
  );
};
