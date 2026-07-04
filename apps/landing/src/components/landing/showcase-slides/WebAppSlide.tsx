'use client';

import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <MiniBrowserChrome className="h-full" dark={true} url="saasflow.app">
      <div className="flex h-full flex-col bg-[#070b12]">
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
            <Button className="h-6 rounded-md px-2 text-[8px]" size="sm">
              Get Started
            </Button>
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
            <Button
              className="h-7 rounded-lg bg-white px-3 text-[9px] text-black hover:bg-white/90"
              size="sm"
            >
              Get Started
            </Button>
            <Button
              className="h-7 rounded-lg border-white/20 bg-transparent px-3 text-[9px] text-white"
              size="sm"
              variant="outline"
            >
              View Demo
            </Button>
          </div>
        </div>

        <Card className="mx-3 mb-0 gap-0 rounded-t-xl rounded-b-none border-white/10 border-b-0 bg-[#0b111b] py-0 shadow-none">
          <CardContent className="px-3 pt-3 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[8px] text-white/45">Revenue</p>
                <p className="font-bold text-base text-white leading-tight">
                  $24,880 <span className="font-medium text-[8px] text-emerald-400">+7.5%</span>
                </p>
              </div>
            </div>
            <Sparkline className="mt-2 h-8 w-full" id="web-slide-spark" />
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {STATS.map((stat) => (
                <div
                  className="rounded-md bg-white/[0.04] px-1.5 py-1.5 text-center"
                  key={stat.label}
                >
                  <p className="text-[7px] text-white/40 uppercase tracking-wide">{stat.label}</p>
                  <p className="font-semibold text-[10px] text-white leading-tight">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MiniBrowserChrome>
  );
}
