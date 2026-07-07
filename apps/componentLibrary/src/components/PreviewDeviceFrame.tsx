'use client';

import type { ViewportPreset } from '@library/lib/previewViewport';
import type { ReactNode } from 'react';
import { IPhoneMockup } from '@/components/deviceMockups/iphoneMockup';
import { MacbookMockup } from '@/components/deviceMockups/macbookMockup';
import { TabletMockup } from '@/components/deviceMockups/tabletMockup';

/**
 * Render the preview device frame component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewDeviceFrame {...props} />;
 */
export const PreviewDeviceFrame = ({
  viewport,
  children,
}: {
  viewport: ViewportPreset;
  children: ReactNode;
}) => {
  if (viewport === 'mobile') {
    return (
      <div className="flex justify-center py-2 transition-all duration-300 ease-in-out">
        <IPhoneMockup color="space-black" model="15-pro" scale={0.72} showHomeIndicator={true}>
          <div className="size-full overflow-hidden bg-background">{children}</div>
        </IPhoneMockup>
      </div>
    );
  }

  if (viewport === 'tablet') {
    return (
      <div className="px-2 transition-all duration-300 ease-in-out">
        <TabletMockup>
          <div className="absolute inset-0 overflow-hidden bg-background">{children}</div>
        </TabletMockup>
      </div>
    );
  }

  if (viewport === 'desktop') {
    return (
      <div className="px-2 transition-all duration-300 ease-in-out">
        <MacbookMockup>
          <div className="absolute inset-0 overflow-hidden bg-background">{children}</div>
        </MacbookMockup>
      </div>
    );
  }

  return <>{children}</>;
};
