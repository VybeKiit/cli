'use client';

import { Play, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const AVATARS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'] as const;

/** Marketing carousel slide — a light landing hero built from the same components. */
export function MarketingBlocksSlide() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#0a1120] to-[#04070d] p-3">
      <Card className="w-full gap-0 border-black/8 bg-white py-0 shadow-2xl">
        <CardContent className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[11px] text-[#0b1220]">
              <span className="h-3.5 w-3.5 rounded-md bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]" />
              SaaSTrack
            </span>
            <Button
              className="h-6 rounded-full bg-[#0b1220] px-2.5 text-[8px] text-white hover:bg-[#0b1220]/90"
              size="sm"
            >
              Start Free Trial
            </Button>
          </div>

          <h4 className="font-bold text-[#0b1220] text-[26px] leading-[1.08] tracking-tight">
            Ship <span className="text-[#7c3aed]">your</span> SaaS
            <br />
            in <span className="text-[#9aa3b2] line-through decoration-[#c7ccd6]">months</span>{' '}
            <span className="text-[#0b1220]">days</span>
          </h4>

          <p className="mt-3 max-w-[240px] text-[#526070] text-[10px] leading-relaxed">
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
              <p className="mt-0.5 text-[#8b95a7] text-[8px]">Loved by 2,000+ builders</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button
              className="h-8 gap-1.5 rounded-lg bg-[#0b1220] px-3 text-[10px] text-white"
              size="sm"
            >
              <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              Tour in 3s
            </Button>
            <Button
              className="h-8 gap-1.5 rounded-lg border-black/10 px-3 text-[#0b1220] text-[10px]"
              size="sm"
              variant="outline"
            >
              <Play className="h-3 w-3" strokeWidth={2} />
              Start free
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
