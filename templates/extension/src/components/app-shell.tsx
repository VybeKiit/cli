import { AppNav } from '@/components/app-nav';
import { getActiveLocale, localeToDirection } from '@/lib/i18n';
import type { ExtensionSurface, ExtensionView } from '@/lib/view';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function AppShell({
  surface,
  view,
  onViewChange,
  children,
}: {
  surface: ExtensionSurface;
  view: ExtensionView;
  onViewChange: (view: ExtensionView) => void;
  children: ReactNode;
}) {
  const dir = localeToDirection(getActiveLocale());
  const isSidePanel = surface === 'sidepanel';
  const isPopup = surface === 'popup';

  return (
    <div
      dir={dir}
      className={cn(
        'flex flex-col text-foreground',
        isSidePanel
          ? 'min-h-screen w-full max-w-2xl bg-background'
          : cn(
              'vk-popup-shell max-h-[40rem] w-[22rem] min-h-[34rem] overflow-hidden',
              isPopup ? 'bg-[#02050a] text-[#f8fafc]' : 'bg-background',
            ),
      )}
    >
      <div className={cn('flex-1 overflow-y-auto p-4', isSidePanel && 'px-6 py-6')}>{children}</div>
      <AppNav active={view} onChange={onViewChange} compact={!isSidePanel} marketing={isPopup} />
    </div>
  );
}
