'use client';

const NAV = ['Features', 'Pricing', 'Docs'] as const;

const STATS = [
  { label: 'Users', value: '1,284' },
  { label: 'MRR', value: '$24k' },
  { label: 'Churn', value: '2.4%' },
  { label: 'Growth', value: '+12.5%' },
] as const;

/** Web App carousel slide — a dark, production-ready SaaS landing rendered in-frame. */
export function WebAppSlide() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#070b12]">
      <div className="h-1 w-full bg-gradient-to-r from-[#ff5f57] via-[#a855f7] to-[#2f80ff]" />

      <div className="flex items-center gap-1.5 border-white/6 border-b px-3 py-2">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-[10px] text-white">
          <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]" />
          SaaSFlow
        </span>
        <nav className="ms-1.5 hidden gap-2 text-[8px] text-white/45 md:flex">
          {NAV.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </nav>
        <span className="ms-auto flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-[8px] text-white/55">Sign In</span>
          <span className="whitespace-nowrap rounded-md bg-[var(--blue)] px-2 py-1 text-[8px] font-medium text-white">
            Get Started
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="font-bold text-[19px] text-white leading-[1.15]">The SaaS Starter Kit</p>
        <p className="font-bold text-[19px] leading-[1.15]">
          <span className="text-blue-gradient">for ambitious developers.</span>
        </p>
        <p className="mt-2.5 max-w-[210px] text-[9px] text-white/50 leading-relaxed">
          Ship faster with our production-ready starter kit.
        </p>
        <div className="mt-3.5 flex items-center gap-2">
          <span className="rounded-lg bg-white px-3 py-1.5 font-medium text-[9px] text-black">
            Get Started
          </span>
          <span className="rounded-lg border border-white/20 px-3 py-1.5 text-[9px] text-white">
            View Demo
          </span>
        </div>
      </div>

      <div className="mx-3 rounded-t-xl border border-white/10 border-b-0 bg-[#0b111b] px-3 pt-3 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] text-white/45">Revenue</p>
            <p className="font-bold text-white text-base leading-tight">
              $24,880 <span className="font-medium text-[8px] text-[var(--green)]">+7.5%</span>
            </p>
          </div>
          <svg aria-hidden="true" className="h-8 w-24" viewBox="0 0 96 32">
            <polyline
              fill="none"
              points="0,26 16,22 32,24 48,14 64,17 80,8 96,11"
              stroke="var(--blue-soft)"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {STATS.map((stat) => (
            <div className="rounded-md bg-white/[0.04] px-1.5 py-1.5 text-center" key={stat.label}>
              <p className="text-[7px] text-white/40 uppercase tracking-wide">{stat.label}</p>
              <p className="font-semibold text-[10px] text-white leading-tight">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
