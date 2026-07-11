'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Switch } from '@vybekiit/ui/switch';
import { Flag, RotateCcw, Save, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { FilterGroup } from './FilterGroup';

type FlagEnv = 'all' | 'production' | 'staging' | 'development';

/** One feature flag row (mirrors the feature_flags preset). */
type FeatureFlag = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly env: Exclude<FlagEnv, 'all'>;
  readonly rollout: number;
};

type StatusFilter = 'all' | 'on' | 'off';

const INITIAL_FLAGS: readonly FeatureFlag[] = [
  {
    id: 'ff_01',
    key: 'checkout.v2',
    label: 'New checkout',
    description: 'Hosted checkout with coupon strip and multi-item cart.',
    enabled: true,
    env: 'production',
    rollout: 100,
  },
  {
    id: 'ff_02',
    key: 'dashboard.beta',
    label: 'Beta dashboard',
    description: 'Command-center layout for early access tenants.',
    enabled: false,
    env: 'staging',
    rollout: 25,
  },
  {
    id: 'ff_03',
    key: 'ai.assistant',
    label: 'AI assistant',
    description: 'In-app chat workspace with knowledge search.',
    enabled: true,
    env: 'development',
    rollout: 40,
  },
  {
    id: 'ff_04',
    key: 'billing.usage_meter',
    label: 'Usage metering',
    description: 'Show seat and API usage on the billing admin page.',
    enabled: false,
    env: 'production',
    rollout: 0,
  },
  {
    id: 'ff_05',
    key: 'realtime.activity',
    label: 'Live activity feed',
    description: 'Subscribe to publication events on the activity page.',
    enabled: true,
    env: 'staging',
    rollout: 80,
  },
];

const ENV_FILTERS: readonly { readonly value: FlagEnv; readonly label: string }[] = [
  { value: 'all', label: 'All envs' },
  { value: 'production', label: 'Prod' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Dev' },
];

const STATUS_FILTERS: readonly { readonly value: StatusFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

/**
 * Interactive feature flags console: toggle, filter, search, dirty save, and reset.
 * Plug-in panel maps onto the feature_flags preset.
 *
 * @returns The feature flags recipe element.
 * @example
 * const element = <FeatureFlagsPage />;
 */
export const FeatureFlagsPage = () => {
  // TODO: Load flags from the configured feature flag source.
  // TODO: Save flag changes through the feature flags preset.
  const searchId = useId();

  const [flags, setFlags] = useState<readonly FeatureFlag[]>(INITIAL_FLAGS);
  const [baseline, setBaseline] = useState<readonly FeatureFlag[]>(INITIAL_FLAGS);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [envFilter, setEnvFilter] = useState<FlagEnv>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(flags) !== JSON.stringify(baseline),
    [flags, baseline],
  );

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return flags.filter((flag) => {
      if (envFilter !== 'all' && flag.env !== envFilter) {
        return false;
      }
      if (statusFilter === 'on' && !flag.enabled) {
        return false;
      }
      if (statusFilter === 'off' && flag.enabled) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return (
        flag.label.toLowerCase().includes(q) ||
        flag.key.toLowerCase().includes(q) ||
        flag.description.toLowerCase().includes(q)
      );
    });
  }, [flags, debouncedQuery, envFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      on: flags.filter((flag) => flag.enabled).length,
      off: flags.filter((flag) => !flag.enabled).length,
    }),
    [flags],
  );

  const toggleFlag = (id: string) => {
    setFlags((current) =>
      current.map((flag) =>
        flag.id === id
          ? {
              ...flag,
              enabled: !flag.enabled,
              rollout: flag.enabled ? flag.rollout : Math.max(flag.rollout, 10),
            }
          : flag,
      ),
    );
  };

  const saveFlags = () => {
    setSaving(true);
    globalThis.setTimeout(() => {
      setBaseline(flags);
      setSaving(false);
      setNotice(`Saved ${flags.length} flags.`);
    }, 600);
  };

  const resetFlags = () => {
    setFlags(baseline);
    setNotice('Discarded unsaved changes.');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Feature flags motion pass">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Feature flags
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Control releases</h1>
            <p className="max-w-xl text-muted-foreground">
              Toggle features per environment, filter by status, and save a dirty draft.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!dirty || saving}
              onClick={resetFlags}
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset
            </Button>
            <Button disabled={!dirty || saving} onClick={saveFlags} type="button">
              <Save aria-hidden="true" className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save flags'}
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: 'on', label: 'On', value: counts.on },
              { key: 'off', label: 'Off', value: counts.off },
              { key: 'dirty', label: 'Dirty', value: dirty ? 1 : 0 },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search flags"
              className="pl-8"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search key or label…"
              value={query}
            />
          </div>
          <FilterGroup
            label="Status"
            onChange={setStatusFilter}
            options={STATUS_FILTERS}
            value={statusFilter}
          />
          <FilterGroup
            label="Env"
            onChange={setEnvFilter}
            options={ENV_FILTERS}
            value={envFilter}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Flag aria-hidden="true" className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Release switches</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <Flag aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No flags match</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Try another search or clear the env filter.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setQuery('');
                    setEnvFilter('all');
                    setStatusFilter('all');
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <ul aria-label="Feature flags" className="divide-y">
                {visible.map((flag) => (
                  <li className="flex items-start gap-3 px-2 py-3" key={flag.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{flag.label}</p>
                        <Badge className="font-mono font-normal text-xs" variant="outline">
                          {flag.key}
                        </Badge>
                        <Badge className="font-normal capitalize" variant="secondary">
                          {flag.env}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">{flag.description}</p>
                      <p className="mt-1 text-muted-foreground text-xs">Rollout {flag.rollout}%</p>
                    </div>
                    <Switch
                      aria-label={`Toggle ${flag.label}`}
                      checked={flag.enabled}
                      onCheckedChange={() => toggleFlag(flag.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — toggles mark the draft dirty until Save. To make it
            real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset feature_flags</code> for the{' '}
              <code>feature_flags</code> table.
            </li>
            <li>
              <code>GET /api/feature-flags</code> loads rows; map <code>key</code>,{' '}
              <code>enabled</code>, <code>env</code>, and <code>rollout</code>.
            </li>
            <li>
              Save → <code>PUT /api/feature-flags</code> with the dirty set (or per-flag{' '}
              <code>PATCH</code>).
            </li>
            <li>
              Gate UI behind a runtime check that reads the same table (or an edge cache of it).
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
