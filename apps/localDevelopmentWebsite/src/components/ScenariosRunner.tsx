'use client';

import type { Journey, JourneyToolEvent } from '@vybekiit/assistant-chat';
import { applyToolEvent, seedJourneysFromMessage } from '@vybekiit/assistant-chat';
import { JourneyRail, ProviderMarkStack } from '@vybekiit/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { postLiveWorkData, shouldUseLiveWorkData } from '@/lib/liveWorkDataClient';
import { postLiveWorkHost, shouldUseLiveWorkHost } from '@/lib/liveWorkHostClient';
import { postLiveWorkPayments, shouldUseLiveWorkPayments } from '@/lib/liveWorkPaymentsClient';
import {
  getOpenableScenario,
  OPENABLE_SCENARIOS,
  type OpenableScenario,
  scenarioBrandTokens,
} from '@/lib/openableScenarios';
import { runJourneyFixtures } from '@/lib/runJourneyFixtures';
import {
  hostVendorFromScenario,
  paymentsVendorFromScenario,
  runLiveWorkDataEvents,
  vendorFromScenario,
} from '@/lib/runLiveWorkDataEvents';

const STEP_MS = 140;

/**
 * Click-to-run scenario demos with Live work cards on the same page.
 * Does not depend on chat store, URL auto-run, or localStorage.
 *
 * @returns Interactive scenarios list + journey rail.
 * @example
 * <ScenariosRunner />
 */
export const ScenariosRunner = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    'Pick a scenario. Cards appear on the right and run to 100%.',
  );
  const [journeys, setJourneys] = useState<readonly Journey[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  /** Sync rail for tool events (React setState is async; fixtures must not race empty). */
  const journeysRef = useRef<readonly Journey[]>([]);

  useEffect(
    () => () => {
      cancelRef.current?.();
    },
    [],
  );

  const applyTool = useCallback((event: JourneyToolEvent) => {
    const current = journeysRef.current;
    if (current.length === 0) {
      return;
    }
    const next = current.map((journey) => applyToolEvent(journey, event));
    journeysRef.current = next;
    setJourneys(next);
  }, []);

  const runScenario = useCallback(
    (scenario: OpenableScenario) => {
      cancelRef.current?.();
      const seeded = seedJourneysFromMessage(scenario.prompt);
      if (seeded.length === 0) {
        setStatus(`No journey matched for “${scenario.prompt}”.`);
        journeysRef.current = [];
        setJourneys([]);
        setActiveId(scenario.id);
        setIsRunning(false);
        return;
      }

      journeysRef.current = seeded;
      setActiveId(scenario.id);
      setJourneys(seeded);
      setIsRunning(true);
      setStatus(`Running: ${scenario.label}… watch steps flip to done.`);

      const search = typeof window === 'undefined' ? '' : window.location.search;
      const env =
        typeof process === 'undefined' ? {} : (process.env as Record<string, string | undefined>);
      const brands = scenarioBrandTokens(scenario);
      const liveData = shouldUseLiveWorkData(search, env) && scenario.domains.includes('database');
      const livePayments =
        shouldUseLiveWorkPayments(search, env) && scenario.domains.includes('payments');
      const liveHost = shouldUseLiveWorkHost(search, env) && scenario.domains.includes('deploy');

      if (liveData || livePayments || liveHost) {
        let cancelled = false;
        cancelRef.current = () => {
          cancelled = true;
        };

        const runLive = async () => {
          // Prefer one concern per scenario: data → payments → host (first match).
          if (liveData) {
            const vendor = vendorFromScenario(scenario.id, brands);
            if (vendor === undefined) {
              return postLiveWorkData({ mode: 'demo', fresh: true });
            }
            return postLiveWorkData({ mode: 'demo', fresh: true, vendor });
          }
          if (livePayments) {
            const vendor = paymentsVendorFromScenario(scenario.id, brands);
            if (vendor === undefined) {
              return postLiveWorkPayments({ mode: 'demo', fresh: true });
            }
            return postLiveWorkPayments({ mode: 'demo', fresh: true, vendor });
          }
          const vendor = hostVendorFromScenario(scenario.id, brands);
          if (vendor === undefined) {
            return postLiveWorkHost({ mode: 'demo', fresh: true });
          }
          return postLiveWorkHost({ mode: 'demo', fresh: true, vendor });
        };

        void runLive().then((result) => {
          if (cancelled) {
            return;
          }
          if (!result.ok) {
            setIsRunning(false);
            setStatus(
              `Live work stopped: ${result.message}. Try again or drop ?live=1 for the offline demo.`,
            );
            if (result.events.length > 0) {
              for (const event of result.events) {
                applyTool(event);
              }
            }
            return;
          }
          const cancel = runLiveWorkDataEvents(
            result.events,
            applyTool,
            () => setIsRunning(true),
            () => {
              setIsRunning(false);
              setStatus(`Done (live): ${result.buyerMessage} Click another to re-run.`);
            },
          );
          cancelRef.current = cancel;
        });
        return;
      }

      const cancel = runJourneyFixtures(
        seeded,
        applyTool,
        () => setIsRunning(true),
        () => {
          setIsRunning(false);
          setStatus(`Done: ${scenario.label} (all steps 100%). Click another to re-run.`);
        },
      );
      cancelRef.current = cancel;
    },
    [applyTool],
  );

  // Deep-link support: /scenarios?run=neon
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const runId = params.get('run');
    if (runId === null || runId.trim() === '') {
      return;
    }
    const scenario = getOpenableScenario(runId);
    if (scenario === undefined) {
      return;
    }
    // Defer one frame so first paint shows the list, then animate.
    const timer = window.setTimeout(() => runScenario(scenario), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [runScenario]);

  const railItems = journeys.map((journey) => {
    const provider = journey.params.provider;
    const resource = journey.params.resource;
    return {
      id: journey.id,
      domain: journey.domain,
      title: journey.title,
      description: journey.skillIntent,
      skillIntent: journey.skillIntent,
      ...(provider === undefined ? {} : { provider }),
      ...(resource === undefined ? {} : { resource }),
      steps: journey.steps.map((s) => ({
        id: s.id,
        label: s.label,
        description: s.description,
        status: s.status,
      })),
    };
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Openable scenarios</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="scenarios-status">
          {status}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Click a button. The Live work panel on the right (or below on mobile) animates to 100%.
          Add <code className="text-xs">?live=1</code> for real Neon claimable on database scenarios
          (network; secrets never shown).
        </p>

        <ol className="mt-8 space-y-3" data-testid="scenarios-list">
          {OPENABLE_SCENARIOS.map((scenario, index) => {
            const isActive = activeId === scenario.id;
            let statusLabel = 'Run →';
            if (isActive && isRunning) {
              statusLabel = 'Running…';
            } else if (isActive) {
              statusLabel = 'Done';
            }
            return (
              <li key={scenario.id}>
                <button
                  type="button"
                  data-testid={`scenario-run-${scenario.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  disabled={isRunning && isActive}
                  onClick={() => runScenario(scenario)}
                  className={
                    isActive
                      ? 'w-full rounded-xl border border-violet-500/60 bg-violet-500/10 px-4 py-3 text-left transition'
                      : 'w-full rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-violet-500/50 hover:bg-violet-500/5'
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProviderMarkStack
                        tokens={scenarioBrandTokens(scenario)}
                        active={isActive && !isRunning}
                        running={isActive && isRunning}
                        size={26}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {index + 1}. {scenario.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-violet-600 dark:text-violet-300">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Domains: {scenario.domains.join(', ')}
                  </p>
                  <p className="mt-1 font-mono text-xs text-foreground/80">“{scenario.prompt}”</p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div data-testid="scenarios-rail-host" className="lg:sticky lg:top-6 lg:self-start">
        {railItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Live work cards show up here after you click Run.
          </div>
        ) : (
          <JourneyRail
            header={
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Live work {isRunning ? '· updating' : '· finished'}
              </p>
            }
            journeys={railItems}
          />
        )}
      </div>
    </div>
  );
};
