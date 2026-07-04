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

/** Payments zig-zag mockup — Stripe connected, today's revenue, recent transactions. */
export function PaymentsMock() {
  return (
    <LightPanel description="Accept payments in minutes." title="Payments">
      <Card className="mb-4 gap-0 border-black/6 bg-white py-0 shadow-none">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold text-[var(--light-text)] text-sm">Provider</p>
            <div className="mt-2 flex items-center gap-2">
              <LogoMarkIcon className="h-4 w-4" slug="stripe" />
              <span className="font-medium text-[var(--light-text)] text-sm">Stripe</span>
            </div>
          </div>
          <Badge className="border-[var(--blue)]/25 bg-[var(--blue)]/10 text-[var(--blue-strong)]">
            Connected
          </Badge>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Card className="gap-0 border-black/6 bg-white py-0 shadow-none">
          <CardContent className="p-4">
            <p className="text-[var(--light-muted)] text-xs">Today</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <p className="font-bold text-2xl text-[var(--light-text)] tracking-tight">
                $2,430.00
              </p>
              <span className="font-medium text-emerald-600 text-xs">+12.5%</span>
            </div>
            <p className="text-[10px] text-[var(--light-muted)]">vs yesterday</p>
            <Sparkline className="mt-3 h-16 w-full" id="payments-zigzag-spark" />
          </CardContent>
        </Card>

        <Card className="gap-0 border-black/6 bg-white py-0 shadow-none">
          <CardContent className="p-4">
            <p className="mb-3 font-semibold text-[var(--light-text)] text-sm">
              Recent Transactions
            </p>
            <Separator className="mb-3 bg-black/6" />
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
          </CardContent>
        </Card>
      </div>
    </LightPanel>
  );
}
