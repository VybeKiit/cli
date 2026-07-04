'use client';

import { Bookmark, Database, FileText, Languages, Reply, Search } from 'lucide-react';

import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { Card, CardContent } from '@/components/ui/card';

const ACTIONS = [
  { label: 'Summarize page', icon: FileText },
  { label: 'Extract data', icon: Database },
  { label: 'Generate reply', icon: Reply },
  { label: 'Translate', icon: Languages },
] as const;

/** Browser Extension carousel slide — assistant popup docked in the browser toolbar. */
export function ExtensionSlide() {
  return (
    <MiniBrowserChrome className="h-full" dark={true} url="docs.yourproduct.com">
      <div className="flex h-full flex-col p-3">
        <Card className="min-h-0 flex-1 gap-0 border-white/12 bg-[#0b111b] py-0 shadow-none">
          <CardContent className="flex h-full flex-col p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]">
                  <span className="h-2 w-2 rounded-[1px] bg-white" />
                </span>
                <p className="font-semibold text-[13px] text-white">VybeKit Assistant</p>
              </div>
              <Bookmark className="h-3.5 w-3.5 text-white/35" strokeWidth={1.8} />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] text-white/40">
              <Search className="h-3 w-3" strokeWidth={2} />
              Ask anything...
            </div>

            <ul className="mt-3 space-y-2">
              {ACTIONS.map((action) => (
                <li
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-[11px] text-white/85"
                  key={action.label}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/60">
                    <action.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                  {action.label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </MiniBrowserChrome>
  );
}
