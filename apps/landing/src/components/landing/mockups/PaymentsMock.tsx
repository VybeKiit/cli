'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

const TRANSACTIONS = [
  { amount: '$48.00', plan: 'Basic Plan', time: '2m ago' },
  { amount: '$99.00', plan: 'Pro Plan', time: '15m ago' },
  { amount: '$249.00', plan: 'Team Plan', time: '1h ago' },
  { amount: '$48.00', plan: 'Basic Plan', time: '2h ago' },
] as const;

/** Sparkline with stroke-dash draw animation on mount. */
function PaymentsSparkline() {
  const reduced = useReducedMotion();
  return (
    <div className="rounded-lg border border-black/6 bg-[var(--light-card-muted)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] text-[var(--light-muted)] uppercase tracking-wide">
          Revenue trend
        </p>
        <Badge
          className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[10px] text-[var(--green)]"
          variant="outline"
        >
          Live
        </Badge>
      </div>
      <svg aria-hidden="true" className="h-20 w-full" viewBox="0 0 200 60">
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
            x1={i * 50}
            x2={i * 50}
            y1="0"
            y2="60"
          />
        ))}
        <motion.polyline
          animate={{ pathLength: 1 }}
          fill="none"
          initial={{ pathLength: reduced ? 1 : 0 }}
          points="0,45 30,40 60,42 90,28 120,32 150,18 180,22 200,10"
          stroke="var(--blue)"
          strokeWidth="2"
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

/** Payments zig-zag mockup — Stripe connected, stats, sparkline. */
export function PaymentsMock() {
  return (
    <div className="light-ui-card w-full rounded-2xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[var(--light-text)] text-xl">Payments</h3>
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[10px] text-[var(--green)]"
              variant="outline"
            >
              Live
            </Badge>
          </div>
          <p className="text-[var(--light-muted)] text-sm">Accept payments in minutes.</p>
        </div>
        <Badge
          className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[var(--green)]"
          variant="outline"
        >
          Live mode
        </Badge>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="font-medium text-[var(--light-text)] text-sm">Stripe</span>
        <Badge
          className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[var(--green)]"
          variant="outline"
        >
          Connected
        </Badge>
        <Badge
          className="border-[var(--blue)]/30 bg-[var(--blue)]/10 text-[10px] text-[var(--blue-strong)]"
          variant="outline"
        >
          Webhooks active
        </Badge>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/6 bg-white/60 p-4">
          <p className="text-[var(--light-muted)] text-xs uppercase tracking-wide">Today</p>
          <p className="font-bold text-3xl text-[var(--light-text)]">
            <AnimatedNumber value="$2,430.00" />
          </p>
          <p className="text-[var(--green)] text-sm">
            <AnimatedNumber value="+12.5%" /> vs yesterday
          </p>
        </div>
        <div className="rounded-lg border border-black/6 bg-white/60 p-4">
          <p className="text-[var(--light-muted)] text-xs uppercase tracking-wide">This month</p>
          <p className="font-bold text-2xl text-[var(--light-text)]">
            <AnimatedNumber value="$18,420" />
          </p>
          <p className="text-[var(--light-muted)] text-sm">
            <AnimatedNumber value="142" /> transactions
          </p>
        </div>
      </div>
      <PaymentsSparkline />
      <div className="mt-6">
        <p className="mb-3 font-semibold text-[var(--light-text)] text-sm">Recent Transactions</p>
        <ul className="space-y-2">
          {TRANSACTIONS.map((tx) => (
            <li
              className="flex justify-between rounded-md border border-black/5 px-3 py-2 text-[var(--light-muted)] text-xs"
              key={`${tx.plan}-${tx.time}`}
            >
              <span>
                <span className="font-medium text-[var(--light-text)]">
                  <AnimatedNumber value={tx.amount} />
                </span>{' '}
                {tx.plan}
              </span>
              <span>{tx.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
