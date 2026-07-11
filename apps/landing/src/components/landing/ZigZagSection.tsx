'use client';

import { motion } from 'framer-motion';
import { OperatorConsoleMock } from '@/components/landing/mockups/OperatorConsole';
import { PaymentsMock } from '@/components/landing/mockups/PaymentsMock';
import { ThreeDeviceMock } from '@/components/landing/mockups/ThreeDeviceMock';
import { SectionShell } from '@/components/ui/SectionShell';
import { ZIGZAG_ROWS } from '@/data/landing';
import { cn } from '@/lib/utils';

const MOCK_COMPONENTS = {
  operator: OperatorConsoleMock,
  payments: PaymentsMock,
  'three-device': ThreeDeviceMock,
} as const;

const PROBLEM_HEADING_LINES = {
  'Boilerplates still leave you holding the bag.': [
    'Boilerplates still',
    'leave you holding the bag.',
  ],
  'Maintaining multiple platforms drains time.': ['Maintaining multiple', 'platforms drains time.'],
  'Payments setup kills momentum.': ['Payments setup', 'kills momentum.'],
} as const satisfies Record<string, readonly string[]>;

const SOLUTION_HEADING_LINES = {
  'Payments foundation is already wired.': ['Payments foundation is', 'already wired.'],
} as const satisfies Record<string, readonly string[]>;

const resolveHeadingLines = (
  heading: string,
  lineBreaks: Readonly<Record<string, readonly string[]>>,
): readonly string[] => {
  const lines = lineBreaks[heading];
  if (lines !== undefined) {
    return lines;
  }
  return [heading];
};

const CopyBlock = ({
  copy,
  uiOnRight,
}: {
  copy: (typeof ZIGZAG_ROWS)[number]['copy'];
  uiOnRight: boolean;
}) => {
  const problemLines = resolveHeadingLines(copy.problemHeading, PROBLEM_HEADING_LINES);
  const solutionLines = resolveHeadingLines(copy.solutionHeading, SOLUTION_HEADING_LINES);

  return (
    <div
      className={cn(
        'zigzag-copy-side flex flex-col justify-center gap-10',
        !uiOnRight && 'zigzag-copy-side--left',
      )}
    >
      <div>
        <p className="text-lg font-bold uppercase tracking-[0.08em] text-[#4ea5ff]">
          {copy.problemLabel}
        </p>
        <h3 className="mt-5 max-w-[620px] text-5xl font-extrabold leading-[1.08] tracking-[-0.045em] text-[#f8fafc]">
          {problemLines.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h3>
        <p className="mt-7 max-w-[600px] text-2xl leading-[1.35] text-[rgba(226,232,240,0.78)]">
          {copy.problemBody}
        </p>
      </div>
      <div>
        <p className="text-lg font-bold uppercase tracking-[0.08em] text-[#4ea5ff]">
          {copy.solutionLabel}
        </p>
        <h3 className="mt-5 max-w-[640px] bg-gradient-to-b from-[#57a9ff] to-[#1f7aff] bg-clip-text text-5xl font-extrabold leading-[1.08] tracking-[-0.045em] text-transparent">
          {solutionLines.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h3>
        <p className="mt-7 max-w-[600px] text-2xl leading-[1.35] text-[rgba(226,232,240,0.78)]">
          {copy.solutionBody}
        </p>
      </div>
    </div>
  );
};

/**
 * Three alternating zig-zag problem/solution rows.
 *
 * @returns The rendered ZigZagSection element.
 * @example
 * ```tsx
 * <ZigZagSection />
 * ```
 */

export const ZigZagSection = () => (
  <div
    className="space-y-16 px-[34px] py-[185px] md:space-y-40"
    style={{
      background:
        'radial-gradient(ellipse at 50% 0%, rgba(20, 64, 120, 0.20) 0%, rgba(5, 8, 13, 0.92) 34%, #020407 78%), #020407',
    }}
  >
    {ZIGZAG_ROWS.map((row) => {
      const Mock = MOCK_COMPONENTS[row.mock];
      return (
        <div className="mx-auto max-w-[1848px]" key={row.id}>
          <div className="overflow-hidden">
            <div
              className={cn(
                'zigzag-row grid gap-0 md:grid-cols-[47.5%_52.5%]',
                `zigzag-row--${row.id}`,
                !row.uiOnRight && 'md:[&>*:first-child]:order-2',
              )}
            >
              <CopyBlock copy={row.copy} uiOnRight={row.uiOnRight} />
              <motion.div
                className="zigzag-visual-side relative z-[2] flex items-center justify-end"
                initial={false}
                transition={{ duration: 0.75 }}
                viewport={{ once: true, amount: 0.2 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
              >
                <Mock />
              </motion.div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
