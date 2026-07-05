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
        <p className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#4ea5ff]">
          {copy.problemLabel}
        </p>
        <h3 className="mt-5 text-[48px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#f8fafc]">
          {copy.problemHeading}
        </h3>
        <p className="mt-7 max-w-[600px] text-[24px] leading-[1.35] text-[rgba(226,232,240,0.78)]">
          {copy.problemBody}
        </p>
      </div>
      <div>
        <p className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#4ea5ff]">
          {copy.solutionLabel}
        </p>
        <h3 className="mt-5 bg-gradient-to-b from-[#57a9ff] to-[#1f7aff] bg-clip-text text-[48px] font-extrabold leading-[1.08] tracking-[-0.045em] text-transparent">
          {copy.solutionHeading}
        </h3>
        <p className="mt-7 max-w-[600px] text-[24px] leading-[1.35] text-[rgba(226,232,240,0.78)]">
          {copy.solutionBody}
        </p>
      </div>
    </div>
  );
}

/** Three alternating zig-zag problem/solution rows. */
export function ZigZagSection() {
  return (
    <div
      className="space-y-16 px-[34px] py-[185px] md:space-y-24"
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
                  'zigzag-row grid md:grid-cols-[47.5%_52.5%] gap-0',
                  !row.uiOnRight && 'md:[&>*:first-child]:order-2',
                )}
              >
                <CopyBlock copy={row.copy} uiOnRight={row.uiOnRight} />
                <motion.div
                  className="zigzag-visual-side relative z-[2] flex items-center justify-end"
                  initial={{ opacity: 0, y: 32, scale: 0.98 }}
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
}
