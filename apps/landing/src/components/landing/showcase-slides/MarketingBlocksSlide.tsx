'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FEATURES = ['Auth ready', 'Payments wired', 'Email templates', 'Analytics'] as const;

const STATS = [
  { label: 'Time to ship', value: '3 days' },
  { label: 'Components', value: '48+' },
  { label: 'Integrations', value: '12' },
] as const;

/** Marketing blocks carousel slide — light landing preview with feature grid. */
export function MarketingBlocksSlide() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-black/10 border-b bg-[#E8ECF2] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28CA42]" />
        <span className="ms-2 text-[10px] text-[var(--light-muted)]">yourproduct.com</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--light-card)] p-3">
        <div className="text-center">
          <Badge className="mb-2 text-[9px]" variant="secondary">
            Launch ready
          </Badge>
          <p className="font-bold text-[var(--light-text)] text-base leading-tight">
            Your SaaS in days
          </p>
          <p className="mx-auto mt-1 max-w-[220px] text-[11px] text-[var(--light-muted)] leading-relaxed">
            Ship a polished marketing page with the same components your product uses.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {FEATURES.map((feat) => (
            <Card className="border-black/6 shadow-none" key={feat}>
              <CardContent className="flex items-center gap-1.5 p-2 text-[9px] text-[var(--light-text)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                {feat}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-3 bg-black/8" />

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-black/6 bg-[var(--light-card-muted)] p-2">
          {STATS.map((stat) => (
            <div className="text-center" key={stat.label}>
              <p className="text-[8px] text-[var(--light-muted)]">{stat.label}</p>
              <p className="font-bold text-[11px] text-[var(--light-text)]">
                <AnimatedNumber value={stat.value} />
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pt-3">
          <div className="flex w-full gap-2">
            <div className="h-8 flex-1 rounded-md bg-[var(--blue)]/10" />
            <div className="h-8 flex-1 rounded-md bg-black/5" />
            <div className="h-8 flex-1 rounded-md bg-black/5" />
          </div>
          <Button className="h-7 w-full text-[10px]" size="sm" tabIndex={-1}>
            Get started
          </Button>
          <p className="text-[9px] text-[var(--light-muted)]">No credit card required</p>
        </div>
      </div>
    </div>
  );
}
