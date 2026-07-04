'use client';

import { Database, FileText, Languages, Reply } from 'lucide-react';

import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { MiniPhoneShell } from '@/components/landing/kit/MiniPhoneShell';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

function DashboardBody({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p
          className={
            compact
              ? 'font-semibold text-[11px] text-white'
              : 'font-bold text-sm text-[var(--light-text)]'
          }
        >
          Dashboard
        </p>
        {compact ? null : (
          <Badge
            className="border-black/8 bg-[var(--light-card-muted)] text-[var(--light-muted)]"
            variant="outline"
          >
            Web
          </Badge>
        )}
      </div>
      <p className={compact ? 'text-[9px] text-white/45' : 'text-[var(--light-muted)] text-xs'}>
        Total Revenue
      </p>
      <p
        className={
          compact
            ? 'font-bold text-base text-white tracking-tight'
            : 'font-bold text-2xl text-[var(--light-text)] tracking-tight'
        }
      >
        $24,880
      </p>
      <p className={compact ? 'text-[8px] text-emerald-400' : 'text-emerald-600 text-xs'}>+12.5%</p>
      <Sparkline
        className={compact ? 'mt-2 h-10 w-full' : 'mt-3 h-16 w-full'}
        id={compact ? 'device-phone-spark' : 'device-web-spark'}
      />
    </>
  );
}

/** Three-device compositing mockup for zig-zag row 3 — web, mobile, extension in one bundle. */
export function ThreeDeviceMock() {
  return (
    <div className="grid w-full items-center gap-4 lg:grid-cols-[1.1fr_0.8fr_0.9fr]">
      <Card className="gap-0 border-black/8 bg-[var(--light-card)] py-0 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <CardContent className="p-5">
          <DashboardBody />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-black/6 bg-white/80 p-2.5">
              <p className="text-[9px] text-[var(--light-muted)]">Active</p>
              <p className="font-bold text-[var(--light-text)] text-sm">1,204</p>
            </div>
            <div className="rounded-lg border border-black/6 bg-white/80 p-2.5">
              <p className="text-[9px] text-[var(--light-muted)]">Growth</p>
              <p className="font-bold text-[var(--light-text)] text-sm">+8.2%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MiniPhoneShell>
        <div className="p-3.5">
          <DashboardBody compact={true} />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PHONE_STATS.map((stat) => (
              <div className="rounded-lg bg-white/5 p-1.5" key={stat.label}>
                <p className="text-[7px] text-white/40">{stat.label}</p>
                <p className="font-bold text-[11px] text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </MiniPhoneShell>

      <MiniBrowserChrome className="min-h-[360px]" dark={true} url="docs.yourproduct.com">
        <div className="flex h-full flex-col p-4">
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
              <li
                className="flex items-center gap-2.5 text-[11px] text-white/85"
                key={action.label}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/60">
                  <action.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      </MiniBrowserChrome>
    </div>
  );
}
