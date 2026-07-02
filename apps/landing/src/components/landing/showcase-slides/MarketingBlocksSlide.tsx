'use client';

import { Play, Star } from 'lucide-react';

const AVATARS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'] as const;

/** Marketing carousel slide — a light landing hero built from the same components. */
export function MarketingBlocksSlide() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#0a1120] to-[#04070d] p-3">
      <div className="flex w-full flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-[11px] text-[#0b1220]">
            <span className="h-3.5 w-3.5 rounded-md bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]" />
            SaaSTrack
          </span>
          <span className="rounded-full bg-[#0b1220] px-2.5 py-1 text-[8px] font-medium text-white">
            Start Free Trial
          </span>
        </div>

        <h4 className="font-bold text-[#0b1220] text-[26px] leading-[1.08] tracking-tight">
          Ship <span className="text-[#7c3aed]">your</span> SaaS
          <br />
          in <span className="text-[#9aa3b2] line-through decoration-[#c7ccd6]">months</span>{' '}
          <span className="text-[#0b1220]">days</span>
        </h4>

        <p className="mt-3 max-w-[240px] text-[10px] text-[#526070] leading-relaxed">
          Ship one product with one team. Move from idea to traction in a weekend, not a quarter.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {AVATARS.map((color) => (
              <span
                className="h-6 w-6 rounded-full border-2 border-white"
                key={color}
                style={{ background: color }}
              />
            ))}
          </div>
          <div>
            <div className="flex gap-0.5 text-[#f5a623]">
              {[0, 1, 2, 3, 4].map((index) => (
                <Star className="h-3 w-3" fill="currentColor" key={index} strokeWidth={0} />
              ))}
            </div>
            <p className="mt-0.5 text-[8px] text-[#8b95a7]">Loved by 2,000+ builders</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-[#0b1220] px-3 py-2 font-medium text-[10px] text-white">
            <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
            Tour in 3s
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 font-medium text-[10px] text-[#0b1220]">
            <Play className="h-3 w-3" strokeWidth={2} />
            Start free
          </span>
        </div>
      </div>
    </div>
  );
}
