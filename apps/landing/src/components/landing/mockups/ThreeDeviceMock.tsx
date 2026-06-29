'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

const EXT_ACTIONS = ['Summarize page', 'Extract data', 'Generate reply', 'Translate'] as const;

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

/** Three-device compositing mockup for zig-zag row 3. */
export function ThreeDeviceMock() {
  return (
    <div className="grid w-full gap-4 lg:grid-cols-3">
      <FloatPanel className="light-ui-card min-h-[420px] rounded-2xl" duration={6}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-[var(--light-text)] text-sm">Dashboard</p>
          <div className="flex items-center gap-1.5">
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[10px] text-[var(--green)]"
              variant="outline"
            >
              Live
            </Badge>
            <Badge className="text-[10px]" variant="secondary">
              Web
            </Badge>
          </div>
        </div>
        <p className="text-[var(--light-muted)] text-xs">Welcome back, Alex.</p>
        <p className="mt-3 text-[var(--light-muted)] text-xs">Total Volume</p>
        <p className="font-bold text-[var(--light-text)] text-xl">
          <AnimatedNumber value="$24,880" />{' '}
          <span className="font-normal text-[var(--green)] text-sm">
            <AnimatedNumber value="+12.5%" />
          </span>
        </p>
        <svg aria-hidden="true" className="mt-3 h-14 w-full" viewBox="0 0 120 40">
          {[0, 30, 60, 90, 120].map((x) => (
            <line key={x} stroke="rgba(0,0,0,0.06)" strokeWidth="1" x1={x} x2={x} y1="0" y2="40" />
          ))}
          <polyline
            fill="none"
            points="0,32 30,28 60,18 90,22 120,10"
            stroke="var(--blue)"
            strokeWidth="2"
          />
        </svg>
        <p className="mt-4 font-semibold text-[var(--light-text)] text-xs">Recent Activity</p>
        <ul className="mt-2 space-y-1.5 text-[11px] text-[var(--light-muted)]">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
            Payment received — <AnimatedNumber value="$99" />
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
            New user signup
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
            Report exported
          </li>
        </ul>
      </FloatPanel>

      <FloatPanel
        className="mx-auto w-full max-w-[190px] rounded-[28px] border-[#222] border-[3px] bg-[#0a0a0a] p-2.5 shadow-xl"
        delay={0.5}
        duration={7}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="rounded-[20px] bg-[#111] p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-semibold text-[11px] text-white">Dashboard</p>
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[8px] text-[var(--green)]"
              variant="outline"
            >
              Live
            </Badge>
          </div>
          <Badge className="mb-2 scale-90 text-[8px]" variant="outline">
            iOS
          </Badge>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">Total Volume</p>
          <p className="font-bold text-base text-white">
            <AnimatedNumber value="$24,880" />
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {['Overview', 'Revenue', 'Growth'].map((t) => (
              <div
                className="rounded bg-white/5 py-1.5 text-center text-[8px] text-[var(--text-muted)]"
                key={t}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="mt-3 h-8 rounded bg-[var(--blue)]/20" />
        </div>
      </FloatPanel>

      <FloatPanel
        className="min-h-[420px] rounded-2xl border border-white/15 bg-[#0d1117] p-6"
        delay={1}
        duration={5.5}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-white text-xs">VybeKiit Assistant</p>
          <div className="flex items-center gap-1">
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[9px] text-[var(--green)]"
              variant="outline"
            >
              Live
            </Badge>
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[9px] text-[var(--green)]"
              variant="outline"
            >
              Ext
            </Badge>
          </div>
        </div>
        <Input
          className="mt-2 h-9 border-white/15 bg-white/5 text-white text-xs"
          placeholder="Ask anything..."
          readOnly={true}
          tabIndex={-1}
        />
        <ul className="mt-3 space-y-2">
          {EXT_ACTIONS.map((action) => (
            <li key={action}>
              <Button
                className="h-8 w-full justify-start border-white/10 bg-white/5 text-[11px] text-white"
                tabIndex={-1}
                variant="outline"
              >
                {action}
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] text-[var(--text-faint)]">Last used: Summarize page</p>
      </FloatPanel>
    </div>
  );
}
