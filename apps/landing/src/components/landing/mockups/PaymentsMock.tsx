'use client';

import { LightPanel } from '@/components/landing/kit/LightPanel';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const TRANSACTIONS = [
  { amount: '$48.00', plan: 'Basic Plan', time: '2m ago' },
  { amount: '$99.00', plan: 'Pro Plan', time: '15m ago' },
  { amount: '$249.00', plan: 'Team Plan', time: '1h ago' },
] as const;

/**
 * Payments zig-zag mockup — Stripe connected, today's revenue, recent transactions.
 *
 * @returns The rendered PaymentsMock element.
 * @example
 * ```tsx
 * <PaymentsMock />
 * ```
 */

export const PaymentsMock = () => (
  <LightPanel
    className="payments-mock-panel"
    contentClassName="payments-mock-panel__content"
    description="Accept payments in minutes."
    title="Payments"
  >
    <Card className="mb-[18px] h-[106px] gap-0 border-black/6 bg-white py-0 shadow-none">
      <CardContent className="flex h-full items-center justify-between p-5">
        <div>
          <p className="font-semibold text-[18px] text-[var(--light-text)]">Provider</p>
          <div className="mt-2 flex items-center gap-2">
            <LogoMarkIcon className="h-4 w-4" slug="stripe" />
            <span className="font-medium text-[16px] text-[var(--light-text)]">Stripe</span>
          </div>
        </div>
        <Badge className="border-[var(--blue)]/20 bg-[var(--blue)]/10 px-3 py-1.5 text-[14px] text-[var(--blue-strong)]">
          Connected
        </Badge>
      </CardContent>
    </Card>

    <div className="grid items-start gap-4 sm:grid-cols-2">
      <Card className="min-h-[258px] gap-0 border-black/6 bg-white py-0 shadow-none">
        <CardContent className="p-5">
          <p className="text-[15px] text-[var(--light-muted)]">Today</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="font-bold text-[30px] text-[var(--light-text)] tracking-tight">
              $2,430.00
            </p>
            <span className="font-medium text-[14px] text-emerald-600">+12.5%</span>
          </div>
          <p className="text-[13px] text-[var(--light-muted)]">vs yesterday</p>
          <Sparkline className="mt-5 h-[110px] w-full" id="payments-zigzag-spark" />
        </CardContent>
      </Card>

      <Card className="min-h-[258px] gap-0 border-black/6 bg-white py-0 shadow-none">
        <CardContent className="p-5">
          <p className="mb-4 font-semibold text-[16px] text-[var(--light-text)]">
            Recent Transactions
          </p>
          <Separator className="mb-4 bg-black/6" />
          <ul className="space-y-4">
            {TRANSACTIONS.map((tx) => (
              <li className="flex items-center justify-between" key={tx.plan}>
                <div>
                  <p className="font-semibold text-[15px] text-[var(--light-text)] leading-tight">
                    {tx.amount}
                  </p>
                  <p className="text-[13px] text-[var(--light-muted)] leading-tight">{tx.plan}</p>
                </div>
                <span className="text-[13px] text-[var(--light-muted)]">{tx.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  </LightPanel>
);
