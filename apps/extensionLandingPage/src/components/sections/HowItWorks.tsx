import { IconBox } from '@vybekiit/ui/icon-box';
import { StepIndicator } from '@vybekiit/ui/step-indicator';
import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';

import { resolveIcon } from '@/components/ui/IconRegistry';
import { SectionShell } from '@/components/ui/SectionShell';
import { HOW_IT_WORKS, HOW_STEPS } from '@/data/landingContent';

/** Compact horizontal progress rail derived from the step data. */
const STEP_RAIL = HOW_STEPS.map((step) => ({
  id: step.key,
  label: step.title,
  status: 'done' as const,
}));

/**
 * How-it-works — eyebrow, heading, a compact `StepIndicator` rail, then three
 * numbered steps (accent number badge + `IconBox` + title/text) mapped from
 * `HOW_STEPS` with connecting arrows, and a "see it in action" link.
 *
 * @returns The rendered how-it-works section.
 * @example
 * <HowItWorks />
 */
export const HowItWorks = () => (
  <SectionShell className="py-16 md:py-24" id="how-it-works">
    <p className="text-center font-semibold text-primary text-xs tracking-widest">
      {HOW_IT_WORKS.eyebrow}
    </p>
    <h2 className="mt-3 text-center font-bold text-3xl tracking-tight md:text-4xl">
      {HOW_IT_WORKS.heading}
    </h2>

    <div className="mx-auto mt-8 flex max-w-xl justify-center">
      <StepIndicator orientation="horizontal" size="sm" steps={STEP_RAIL} />
    </div>

    <div className="mt-10 flex flex-col items-stretch gap-6 md:flex-row md:items-start md:justify-center">
      {HOW_STEPS.map((step, index) => {
        const Icon = resolveIcon(step.icon);
        return (
          <Fragment key={step.key}>
            <div className="flex flex-1 items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
                {step.step}
              </span>
              <IconBox className="bg-primary/10 text-primary" size="lg">
                <Icon className="h-6 w-6" />
              </IconBox>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="mt-1 text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
            {index < HOW_STEPS.length - 1 ? (
              <ArrowRight
                aria-hidden="true"
                className="hidden h-5 w-5 shrink-0 self-center text-muted-foreground md:block"
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>

    <div className="mt-10 text-center">
      <a
        className="font-semibold text-primary text-xs tracking-widest hover:underline"
        href={HOW_IT_WORKS.linkHref}
      >
        {HOW_IT_WORKS.linkLabel}
      </a>
    </div>
  </SectionShell>
);
