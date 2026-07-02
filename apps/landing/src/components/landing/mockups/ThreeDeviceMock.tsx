'use client';

import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Database, FileText, Languages, Reply } from 'lucide-react';
import type { ReactNode } from 'react';

const EXT_ACTIONS = [
  { label: 'Summarize page', icon: FileText },
  { label: 'Extract data', icon: Database },
  { label: 'Generate reply', icon: Reply },
  { label: 'Translate', icon: Languages },
] as const;

const PHONE_STATS = [
  { label: 'Users', value: '2,401' },
  { label: 'MRR', value: '$1,380' },
] as const;

const AREA_LINE = 'M0,32 C15,30 22,22 38,24 C55,26 62,14 80,16 C98,18 108,8 120,10';
const AREA_FILL = `${AREA_LINE} L120,40 L0,40 Z`;

function FloatPanel({
  children,
  className,
  duration,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  duration: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const props: HTMLMotionProps<'div'> = {
    className: cn(className),
    ...(reduced
      ? {}
      : {
          animate: { y: [0, -6, 0] },
          transition: {
            duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut' as const,
            delay,
          },
        }),
  };

  return <motion.div {...props}>{children}</motion.div>;
}

/** Three-device compositing mockup for zig-zag row 3 — web, mobile, extension in one bundle. */
export function ThreeDeviceMock() {
  return (
    <div className="grid w-full gap-4 lg:grid-cols-3">
      <FloatPanel className="light-ui-card min-h-[420px] rounded-2xl" duration={6}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-[var(--light-text)] text-sm">Dashboard</p>
          <span className="rounded-full bg-[var(--light-card-muted)] px-2 py-0.5 text-[10px] text-[var(--light-muted)]">
            Web
          </span>
        </div>
        <p className="text-[var(--light-muted)] text-xs">Total Revenue</p>
        <p className="font-bold text-[var(--light-text)] text-2xl tracking-tight">$24,880</p>
        <p className="text-[var(--green)] text-xs">+12.5%</p>
        <svg
          aria-hidden="true"
          className="mt-3 h-16 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 120 40"
        >
          <defs>
            <linearGradient id="device-web-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={AREA_FILL} fill="url(#device-web-area)" />
          <path
            d={AREA_LINE}
            fill="none"
            stroke="var(--blue)"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-black/6 bg-white/60 p-2.5">
            <p className="text-[9px] text-[var(--light-muted)]">Active</p>
            <p className="font-bold text-[var(--light-text)] text-sm">1,204</p>
          </div>
          <div className="rounded-lg border border-black/6 bg-white/60 p-2.5">
            <p className="text-[9px] text-[var(--light-muted)]">Growth</p>
            <p className="font-bold text-[var(--light-text)] text-sm">+8.2%</p>
          </div>
        </div>
      </FloatPanel>

      <FloatPanel
        className="mx-auto w-full max-w-[190px] rounded-[28px] border-[3px] border-[#1b1f26] bg-[#050810] p-2.5 shadow-xl"
        delay={0.5}
        duration={7}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="rounded-[20px] bg-[#080d16] p-3.5">
          <p className="font-semibold text-[11px] text-white">Dashboard</p>
          <p className="mt-2 text-[9px] text-white/45">Total Revenue</p>
          <p className="font-bold text-base text-white">$24,880</p>
          <p className="text-[8px] text-[var(--green)]">+12.5%</p>
          <svg
            aria-hidden="true"
            className="mt-2 h-10 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 120 40"
          >
            <path d={AREA_FILL} fill="url(#device-web-area)" />
            <path
              d={AREA_LINE}
              fill="none"
              stroke="var(--blue-soft)"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PHONE_STATS.map((stat) => (
              <div className="rounded-lg bg-white/5 p-1.5" key={stat.label}>
                <p className="text-[7px] text-white/40">{stat.label}</p>
                <p className="font-bold text-[11px] text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </FloatPanel>

      <FloatPanel
        className="min-h-[420px] rounded-2xl border border-white/15 bg-[#0b111b] p-5"
        delay={1}
        duration={5.5}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]">
            <span className="h-2 w-2 rounded-[1px] bg-white" />
          </span>
          <p className="font-semibold text-white text-xs">VybeKit Assistant</p>
        </div>
        <div className="rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-2 text-[10px] text-white/40">
          Ask anything...
        </div>
        <ul className="mt-3 space-y-2">
          {EXT_ACTIONS.map((action) => (
            <li className="flex items-center gap-2.5 text-[11px] text-white/85" key={action.label}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/60">
                <action.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
              {action.label}
            </li>
          ))}
        </ul>
      </FloatPanel>
    </div>
  );
}
