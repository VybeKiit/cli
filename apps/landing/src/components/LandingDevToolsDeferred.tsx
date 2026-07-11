'use client';

import type { VybeAssistant } from '@vybekiit/report-mode';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';

interface LandingDevToolsDeferredProps {
  readonly showReport: boolean;
  readonly showChat: boolean;
  /** Null only when report-mode mounts alone with no configured assistant. */
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
  readonly bridgeUrl: string;
  readonly referralCode?: string;
}

type ReportModeDevComponent = ComponentType<{
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
}>;

type AssistantChatLauncherComponent = ComponentType<{
  readonly assistant: VybeAssistant;
  readonly bridgeUrl: string;
  readonly referralCode?: string;
}>;

type TooltipProviderComponent = ComponentType<{
  readonly children: ReactNode;
  readonly delayDuration?: number;
  readonly skipDelayDuration?: number;
}>;

type ToasterComponent = ComponentType<{
  readonly position?: 'bottom-center';
  readonly richColors?: boolean;
}>;

/**
 * Idle-loads report-mode + assistant-chat client graphs so mermaid/shiki never
 * inflate the critical layout chunk and freeze first paint in dev.
 *
 * @param props - Server-resolved feature flags and serializable config.
 * @returns Dev tools after idle, or null while waiting / when both flags are off.
 * @example
 * <LandingDevToolsDeferred showReport showChat={false} assistant={null} projectRoot={cwd} bridgeUrl="http://localhost:4319" />
 */
export const LandingDevToolsDeferred = ({
  showReport,
  showChat,
  assistant,
  projectRoot,
  bridgeUrl,
  referralCode,
}: LandingDevToolsDeferredProps) => {
  const [ReportModeDev, setReportModeDev] = useState<ReportModeDevComponent | null>(null);
  const [AssistantChatLauncher, setAssistantChatLauncher] =
    useState<AssistantChatLauncherComponent | null>(null);
  const [TooltipProvider, setTooltipProvider] = useState<TooltipProviderComponent | null>(null);
  const [Toaster, setToaster] = useState<ToasterComponent | null>(null);

  useEffect(() => {
    if (!(showReport || showChat)) {
      return;
    }

    let cancelled = false;

    const load = () => {
      void (async () => {
        if (showReport) {
          const [{ ReportModeDev: Report }, { TooltipProvider: Tooltip }, { Toaster: Toast }] =
            await Promise.all([
              import('@/components/report-mode/ReportModeDev'),
              import('@/components/ui/tooltip'),
              import('sonner'),
            ]);
          if (!cancelled) {
            void import('@/components/report-mode/dock/styles/report-mode-dock.css');
            setReportModeDev(() => Report);
            setTooltipProvider(() => Tooltip);
            setToaster(() => Toast);
          }
        }

        if (showChat) {
          const { AssistantChatLauncher: Launcher } = await import(
            '@/components/tools/assistant-chat/AssistantChatLauncher'
          );
          if (!cancelled) {
            setAssistantChatLauncher(() => Launcher);
          }
        }
      })();
    };

    if (typeof globalThis.requestIdleCallback === 'function') {
      const idleId = globalThis.requestIdleCallback(load, { timeout: 2500 });
      return () => {
        cancelled = true;
        globalThis.cancelIdleCallback(idleId);
      };
    }

    const timer = globalThis.setTimeout(load, 800);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [showChat, showReport]);

  return (
    <>
      {showReport && ReportModeDev && TooltipProvider && Toaster ? (
        <TooltipProvider delayDuration={500} skipDelayDuration={0}>
          <Toaster position="bottom-center" richColors={true} />
          <ReportModeDev assistant={assistant} projectRoot={projectRoot} />
        </TooltipProvider>
      ) : null}
      {showChat && AssistantChatLauncher ? (
        <AssistantChatLauncher
          assistant={assistant ?? 'claude'}
          bridgeUrl={bridgeUrl}
          {...(referralCode !== undefined && referralCode.length > 0 ? { referralCode } : {})}
        />
      ) : null}
    </>
  );
};
