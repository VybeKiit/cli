import { AddToBrowserButtons } from '@/components/ui/AddToBrowserButton';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SectionShell } from '@/components/ui/SectionShell';
import { READY_CTA } from '@/data/landingContent';

/**
 * Closing call-to-action band — an accent-tinted panel with the brand mark,
 * heading, subhead, and the Chrome/Edge install buttons.
 *
 * @returns The rendered closing CTA band.
 * @example
 * <ReadyCta />
 */
export const ReadyCta = () => (
  <SectionShell className="py-8" id="install">
    <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-primary/5 p-8 md:flex-row md:p-10">
      <div className="flex items-center gap-4">
        <BrandLogo className="h-10 w-10" />
        <div>
          <h2 className="font-bold text-2xl tracking-tight md:text-3xl">{READY_CTA.heading}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{READY_CTA.subhead}</p>
        </div>
      </div>
      <AddToBrowserButtons />
    </div>
  </SectionShell>
);
