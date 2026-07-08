'use client';

import { Database, FileText, Languages, Reply } from 'lucide-react';

import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { MiniPhoneShell } from '@/components/landing/kit/MiniPhoneShell';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';

const EXT_ACTIONS = [
  { label: 'Summarize page', icon: FileText },
  { label: 'Extract data', icon: Database },
  { label: 'Generate reply', icon: Reply },
  { label: 'Translate', icon: Languages },
] as const;

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
  <MiniPhoneShell className="absolute top-[68px] left-[316px] z-20 h-[448px] w-[224px] max-w-none rounded-[38px] border-[4px] border-[#151922] bg-[#030712] p-2 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
    <div className="h-full px-4 pt-5 pb-3">
      <div className="mb-5 flex items-center justify-between text-white">
        <span className="font-bold text-[11px]">9:41</span>
        <span className="text-[10px]">▰ ▰</span>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-bold text-[17px] text-white">Dashboard</p>
        <span className="text-white/55 text-xs">◎ ◎</span>
      </div>
      <p className="text-[9px] text-white/44">Total Volume</p>
      <p className="font-bold text-[24px] text-white tracking-tight">$24,880</p>
      <p className="text-[9px] text-emerald-400">+12.5%</p>
      <Sparkline className="mt-5 h-[120px] w-full" id="device-phone-spark" />
      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
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

const AssistantPanel = () => (
  <MiniBrowserChrome
    className="absolute top-[136px] right-[20px] z-10 h-[306px] w-[220px] rounded-[13px] shadow-[0_18px_48px_rgba(2,6,23,0.36)]"
    dark={true}
    url=""
  >
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]">
          <span className="h-2 w-2 rounded-[1px] bg-white" />
        </span>
        <p className="font-semibold text-white text-xs">VybeKit Assistant</p>
        <span className="ml-auto text-white/45 text-xs">⌘</span>
      </div>
      <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-[10px] text-white/40">
        Ask anything...
      </div>
      <ul className="mt-4 space-y-3">
        {EXT_ACTIONS.map((action) => (
          <li className="flex items-center gap-3 text-[11px] text-white/85" key={action.label}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/60">
              <action.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  </MiniBrowserChrome>
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
      <AssistantPanel />
    </div>
  </div>
);
