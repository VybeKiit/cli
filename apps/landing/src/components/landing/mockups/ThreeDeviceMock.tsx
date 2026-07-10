'use client';

import { ExtensionPopupScene } from '@/components/landing/kit/ExtensionPopupScene';
import { MiniPhoneShell } from '@/components/landing/kit/MiniPhoneShell';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';

const PHONE_STATS = [
  { label: 'Revenue', value: '$2,48' },
  { label: 'Growth', value: '$1,380' },
] as const;

const DesktopDashboard = () => (
  <div className="absolute top-[38px] left-[28px] h-[430px] w-[294px] rounded-[13px] border border-black/8 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.14)]">
    <div className="flex items-center justify-between border-black/5 border-b px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1f7aff]">
          <VybeLogoIcon className="h-4 w-4 text-white" />
        </span>
        <p className="font-bold text-[13px] text-[#0f172a]">Dashboard</p>
      </div>
      <span className="text-[#64748b] text-xs">⌄</span>
    </div>

    <div className="px-5 pt-4">
      <p className="font-semibold text-[#0f172a] text-[13px]">Welcome back, Alex.</p>
      <p className="mt-1 text-[#64748b] text-[10px]">Here&apos;s what&apos;s happening today.</p>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[#64748b] text-[11px]">Total Volume</p>
          <span className="text-[9px] text-emerald-600">+12.5%</span>
        </div>
        <p className="font-bold text-[24px] text-[#0f172a] tracking-tight">$24,880</p>
        <Sparkline className="mt-5 h-[122px] w-full" id="device-web-spark" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {['Invoice', 'Subscription', 'Payout', 'Refund'].map((label, index) => (
          <div className="rounded-lg border border-black/6 bg-[#f8fafc] px-3 py-2" key={label}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0f172a] text-[9px]">{label}</p>
              <span className="text-[8px] text-[#94a3b8]">{index + 2}m ago</span>
            </div>
            <p className="mt-1 text-[8px] text-[#64748b]">$1,500</p>
            <p className="text-[8px] text-emerald-600">Processed</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PhoneDashboard = () => (
  <MiniPhoneShell className="mini-iphone--flat absolute top-[52px] left-[318px] z-20 h-[460px] w-[214px] max-w-none">
    <div className="h-full px-3.5 pt-1 pb-1">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold text-[15px] text-white">Dashboard</p>
        <span className="text-white/55 text-xs">◎ ◎</span>
      </div>
      <p className="text-[9px] text-white/44">Total Volume</p>
      <p className="font-bold text-[24px] text-white tracking-tight">$24,880</p>
      <p className="text-[9px] text-emerald-400">+12.5%</p>
      <Sparkline className="mt-4 h-[110px] w-full" id="device-phone-spark" />
      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <p className="font-semibold text-[11px] text-white/80">Overview</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PHONE_STATS.map((stat) => (
            <div className="rounded-lg bg-white/[0.04] p-2" key={stat.label}>
              <p className="text-[8px] text-white/40">{stat.label}</p>
              <p className="font-bold text-[13px] text-white">{stat.value}</p>
              <p className="text-[7px] text-emerald-400">+12.5%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </MiniPhoneShell>
);

/**
 * Three-device compositing mockup for zig-zag row 3 — web, mobile, extension in one bundle.
 *
 * @returns The rendered ThreeDeviceMock element.
 * @example
 * ```tsx
 * <ThreeDeviceMock />
 * ```
 */
export const ThreeDeviceMock = () => (
  <div className="three-device-showcase relative h-[502px] w-[780px] overflow-visible rounded-[14px] bg-[#f8fafc] shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
    <div className="three-device-showcase__mockups absolute inset-0">
      <DesktopDashboard />
      <PhoneDashboard />
      <div className="absolute top-[120px] right-[16px] z-10 h-[320px] w-[236px]">
        <ExtensionPopupScene animated={true} className="h-full shadow-lg" />
      </div>
    </div>
  </div>
);
