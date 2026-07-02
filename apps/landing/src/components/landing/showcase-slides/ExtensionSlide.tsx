'use client';

import { Bookmark, Database, FileText, Languages, Reply, Search } from 'lucide-react';

const ACTIONS = [
  { label: 'Summarize page', icon: FileText },
  { label: 'Extract data', icon: Database },
  { label: 'Generate reply', icon: Reply },
  { label: 'Translate', icon: Languages },
] as const;

/** Browser Extension carousel slide — assistant popup docked in the browser toolbar. */
export function ExtensionSlide() {
  return (
    <div className="flex h-full flex-col bg-[#05070c] p-3">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <div className="ms-1 flex-1 rounded-md bg-white/[0.05] px-2 py-1 text-[8px] text-white/35">
          docs.yourproduct.com
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--blue)]/20">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-gradient-to-br from-[#62a1ff] to-[#1e6bff]" />
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/12 bg-[#0b111b] p-3.5">
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
      </div>
    </div>
  );
}
