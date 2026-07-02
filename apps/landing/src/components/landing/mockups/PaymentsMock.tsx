'use client';

import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';

const TRANSACTIONS = [
  { amount: '$48.00', plan: 'Basic Plan', time: '2m ago' },
  { amount: '$99.00', plan: 'Pro Plan', time: '15m ago' },
  { amount: '$249.00', plan: 'Team Plan', time: '1h ago' },
] as const;

/** Payments zig-zag mockup — Stripe connected, today's revenue, recent transactions. */
export function PaymentsMock() {
  return (
    <div className="light-ui-card w-full rounded-2xl">
      <div className="mb-5">
        <h3 className="font-bold text-[var(--light-text)] text-xl">Payments</h3>
        <p className="mt-1 text-[var(--light-muted)] text-sm">Accept payments in minutes.</p>
      </div>

      <div className="mb-4 rounded-xl border border-black/6 bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[var(--light-text)] text-sm">Provider</p>
          <span className="rounded-full border border-[var(--blue)]/25 bg-[var(--blue)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--blue-strong)]">
            Connected
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <LogoMarkIcon className="h-4 w-4" slug="stripe" />
          <span className="font-medium text-[var(--light-text)] text-sm">Stripe</span>
        </div>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/6 bg-white/70 p-4">
          <p className="text-[var(--light-muted)] text-xs">Today</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="font-bold text-2xl text-[var(--light-text)] tracking-tight">$2,430.00</p>
            <span className="font-medium text-[var(--green)] text-xs">+12.5%</span>
          </div>
          <p className="text-[10px] text-[var(--light-muted)]">vs yesterday</p>
          <svg
            aria-hidden="true"
            className="mt-3 h-16 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 220 60"
          >
            <defs>
              <linearGradient id="payments-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,46 C25,44 35,38 55,40 C80,42 90,30 110,28 C135,26 150,20 175,16 C195,13 210,9 220,7 L220,60 L0,60 Z"
              fill="url(#payments-area)"
            />
            <path
              d="M0,46 C25,44 35,38 55,40 C80,42 90,30 110,28 C135,26 150,20 175,16 C195,13 210,9 220,7"
              fill="none"
              stroke="var(--blue)"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        <div className="rounded-xl border border-black/6 bg-white/70 p-4">
          <p className="mb-3 font-semibold text-[var(--light-text)] text-sm">Recent Transactions</p>
          <ul className="space-y-3">
            {TRANSACTIONS.map((tx) => (
              <li className="flex items-center justify-between" key={tx.plan}>
                <div>
                  <p className="font-semibold text-[var(--light-text)] text-sm leading-tight">
                    {tx.amount}
                  </p>
                  <p className="text-[11px] text-[var(--light-muted)] leading-tight">{tx.plan}</p>
                </div>
                <span className="text-[11px] text-[var(--light-muted)]">{tx.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
