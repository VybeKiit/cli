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
 * Mobile App carousel slide — native dashboard inside a phone frame.
 *
 * @returns The rendered MobileAppSlide element.
 * @example
 * ```tsx
 * <MobileAppSlide />
 * ```
 */

export const MobileAppSlide = () => (
  <div className="flex h-full items-center justify-center bg-[#03070d] p-3">
    <MiniPhoneShell className="h-full max-h-[430px]">
      <div className="flex h-full flex-col p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-[13px] text-white">Dashboard</p>
          <span className="text-[9px] text-white/40">9:41</span>
        </div>

        <p className="text-[9px] text-white/45">Total Revenue</p>
        <div className="flex items-end gap-2">
          <p className="font-bold text-[22px] text-white leading-none">$24,880</p>
          <span className="mb-0.5 text-[9px] text-emerald-400">+12.5%</span>
        </div>

        <Sparkline className="mt-3 h-20 w-full" id="mobile-slide-spark" />
        <div className="mt-1 flex justify-between text-[7px] text-white/30">
          {DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <p className="mt-3 mb-1.5 font-semibold text-[10px] text-white/80">Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {STATS.map((stat) => (
            <Card
              className="gap-0 border-white/8 bg-white/[0.04] py-0 shadow-none"
              key={stat.label}
            >
              <CardContent className="p-2.5">
                <p className="text-[8px] text-white/40">{stat.label}</p>
                <p className="font-bold text-[13px] text-white leading-tight">{stat.value}</p>
                <p className={stat.up ? 'text-[8px] text-emerald-400' : 'text-[8px] text-red-400'}>
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
