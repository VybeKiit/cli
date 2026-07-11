'use client';

import { MiniPhoneShell } from '@/components/landing/kit/MiniPhoneShell';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { Card, CardContent } from '@/components/ui/card';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const STATS = [
  { label: 'Users', value: '9,248', delta: '+8.2%', up: true },
  { label: 'MRR', value: '$1,290', delta: '-2.4%', up: false },
] as const;

/**
 * Mobile App carousel slide — native dashboard inside a realistic iPhone frame.
 *
 * @returns The rendered MobileAppSlide element.
 * @example
 * ```tsx
 * <MobileAppSlide />
 * ```
 */
export const MobileAppSlide = () => (
  <div className="flex h-full items-center justify-center bg-[#03070d] p-3">
    <MiniPhoneShell className="h-full max-h-[430px] w-[188px] max-w-none">
      <div className="flex h-full flex-col px-3 pt-1 pb-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-sm text-white">Dashboard</p>
          <span className="text-xs text-white/40">Today</span>
        </div>

        <p className="text-xs text-white/45">Total Revenue</p>
        <div className="flex items-end gap-2">
          <p className="font-bold text-2xl text-white leading-none">$24,880</p>
          <span className="mb-0.5 text-xs text-emerald-400">+12.5%</span>
        </div>

        <Sparkline className="mt-3 h-20 w-full" id="mobile-slide-spark" />
        <div className="mt-1 flex justify-between text-xs text-white/30">
          {DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <p className="mt-3 mb-1.5 font-semibold text-xs text-white/80">Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {STATS.map((stat) => (
            <Card
              className="gap-0 border-white/8 bg-white/[0.04] py-0 shadow-none"
              key={stat.label}
            >
              <CardContent className="p-2.5">
                <p className="text-xs text-white/40">{stat.label}</p>
                <p className="font-bold text-sm text-white leading-tight">{stat.value}</p>
                <p className={stat.up ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>
                  {stat.delta}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MiniPhoneShell>
  </div>
);
