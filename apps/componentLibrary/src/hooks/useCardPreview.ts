'use client';

import { usePreviewLoaded } from '@library/hooks/usePreviewLoaded';
import { usePreviewTheme } from '@library/hooks/usePreviewTheme';
import { markPreviewLoaded } from '@library/lib/previewCache';
import { acquirePreviewLoadSlot } from '@library/lib/previewLoadQueue';
import { postPreviewTheme } from '@library/lib/previewMessaging';
import { buildPreviewSrc, type PreviewMode } from '@library/lib/theme';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

const CARD_PREVIEW_ROOT_MARGIN = '0px 0px 48px 0px';
const CARD_PREVIEW_UNLOAD_MS = 15_000;

export interface UseCardPreviewArgs {
  readonly namespace: string;
  readonly name: string;
  readonly previewKey: string;
  readonly mode: PreviewMode;
}

export interface UseCardPreviewResult {
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly iframeRef: RefObject<HTMLIFrameElement | null>;
  readonly src: string | null;
  readonly engaged: boolean;
  readonly setEngaged: (engaged: boolean) => void;
  readonly showSpinner: boolean;
  readonly wasLoaded: boolean;
  readonly handleIframeLoad: () => void;
  readonly handleIframeError: () => void;
}

/**
 * Lazy card-preview lifecycle: intersect → queue slot → load iframe → unload on leave.
 *
 * @param args - Catalog identity, theme mode, and stable preview key.
 * @returns Refs, load state, and iframe event handlers for the card shell.
 * @example
 * const preview = useCardPreview({ namespace, name, previewKey, mode: 'dark' });
 */
export const useCardPreview = ({
  namespace,
  name,
  previewKey,
  mode,
}: UseCardPreviewArgs): UseCardPreviewResult => {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { primary } = usePreviewTheme();
  const [src, setSrc] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const wasLoaded = usePreviewLoaded(previewKey);
  const [showSpinner, setShowSpinner] = useState(false);
  const loadGenerationRef = useRef(0);
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const hasSrcRef = useRef(false);
  const pendingLoadRef = useRef(false);

  const releaseLoadSlot = useCallback(() => {
    releaseSlotRef.current?.();
    releaseSlotRef.current = null;
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let cancelled = false;
    let unloadTimer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([intersection]) => {
        const visible = intersection === undefined ? false : intersection.isIntersecting === true;

        if (unloadTimer) {
          clearTimeout(unloadTimer);
          unloadTimer = undefined;
        }

        if (visible) {
          if (hasSrcRef.current || pendingLoadRef.current) {
            return;
          }

          pendingLoadRef.current = true;
          const generation = loadGenerationRef.current + 1;
          loadGenerationRef.current = generation;
          setShowSpinner(!wasLoaded);

          void acquirePreviewLoadSlot().then((release) => {
            if (cancelled || generation !== loadGenerationRef.current) {
              release();
              pendingLoadRef.current = false;
              return;
            }

            releaseSlotRef.current = release;
            pendingLoadRef.current = false;
            hasSrcRef.current = true;
            setSrc(
              buildPreviewSrc(namespace, name, {
                thumb: true,
                interactive: false,
              }),
            );
          });
          return;
        }

        if (!hasSrcRef.current) {
          return;
        }

        unloadTimer = setTimeout(() => {
          loadGenerationRef.current += 1;
          releaseLoadSlot();
          pendingLoadRef.current = false;
          hasSrcRef.current = false;
          setSrc(null);
          setShowSpinner(false);
        }, CARD_PREVIEW_UNLOAD_MS);
      },
      { rootMargin: CARD_PREVIEW_ROOT_MARGIN, threshold: 0.1 },
    );

    observer.observe(host);
    return () => {
      cancelled = true;
      loadGenerationRef.current += 1;
      if (unloadTimer) {
        clearTimeout(unloadTimer);
      }
      releaseLoadSlot();
      pendingLoadRef.current = false;
      observer.disconnect();
    };
  }, [namespace, name, wasLoaded, releaseLoadSlot]);

  useEffect(() => {
    if (!src) {
      return;
    }
    postPreviewTheme(iframeRef.current, mode, primary);
  }, [mode, primary, src]);

  const handleIframeLoad = useCallback(() => {
    releaseLoadSlot();
    markPreviewLoaded(previewKey);
    setShowSpinner(false);
    postPreviewTheme(iframeRef.current, mode, primary);
  }, [mode, primary, previewKey, releaseLoadSlot]);

  const handleIframeError = useCallback(() => {
    releaseLoadSlot();
    setShowSpinner(false);
  }, [releaseLoadSlot]);

  return {
    hostRef,
    iframeRef,
    src,
    engaged,
    setEngaged,
    showSpinner,
    wasLoaded,
    handleIframeLoad,
    handleIframeError,
  };
};
