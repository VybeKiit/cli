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

function CopyBlock({
  copy,
  uiOnRight,
}: {
  copy: (typeof ZIGZAG_ROWS)[number]['copy'];
  uiOnRight: boolean;
}) {
  return (
    <div
      className={cn(
        'zigzag-copy-side flex flex-col justify-center gap-10',
        !uiOnRight && 'zigzag-copy-side--left',
      )}
    >
      <div>
        <p className="landing-label">{copy.problemLabel}</p>
        <h3 className="problem-heading mt-3 text-white">{copy.problemHeading}</h3>
        <p className="mt-4 text-xl leading-relaxed text-[var(--text-muted)]">{copy.problemBody}</p>
      </div>
      <div>
        <p className="landing-label">{copy.solutionLabel}</p>
        <h3 className="solution-heading text-blue-gradient mt-3">{copy.solutionHeading}</h3>
        <p className="mt-4 text-xl leading-relaxed text-[var(--text-muted)]">{copy.solutionBody}</p>
      </div>
    </div>
  );
}

/** Three alternating zig-zag problem/solution rows. */
export function ZigZagSection() {
  return (
    <div className="space-y-16 py-16 md:space-y-24 md:py-24">
      {ZIGZAG_ROWS.map((row) => {
        const Mock = MOCK_COMPONENTS[row.mock];
        return (
          <SectionShell key={row.id}>
            <div className="panel blue-top-glow overflow-hidden">
              <div
                className={cn(
                  'zigzag-row grid md:grid-cols-2',
                  !row.uiOnRight && 'md:[&>*:first-child]:order-2',
                )}
              >
                <CopyBlock copy={row.copy} uiOnRight={row.uiOnRight} />
                <motion.div
                  className="zigzag-visual-side relative z-[2] flex items-center"
                  initial={{ opacity: 0, y: 32, scale: 0.98 }}
                  transition={{ duration: 0.75 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                >
                  <Mock />
                </motion.div>
              </div>
            </div>
          </SectionShell>
        );
      })}
    </div>
  );
}
