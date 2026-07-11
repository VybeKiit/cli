'use client';

import { ArrowUpRight, Check, Inbox, Search, Settings, Users, Zap } from 'lucide-react';

import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const TICKETS = [
  {
    icon: 'W',
    title: 'Wire payment initiation',
    body: 'Wire transfer for $2,500 to Acme Corp.',
  },
  {
    icon: 'R',
    title: 'Refund request',
    body: 'Process a refund for Order #7234 ($89).',
  },
  {
    icon: 'U',
    title: 'User account suspension',
    body: 'Suspend user john.doe@example.com for policy violation.',
  },
  {
    icon: 'S',
    title: 'Subscription renewal',
    body: 'Renew the annual subscription for enterprise@company.com.',
  },
  {
    icon: 'P',
    title: 'Password reset request',
    body: 'Reset password for user jane.smith@example.com.',
  },
] as const;

const RAIL_ICONS = [Inbox, Zap, Users, Settings] as const;

/**
 * AI Operator carousel slide — a support-desk inbox the operator works autonomously.
 *
 * @returns The rendered AIOperatorSlide element.
 * @example
 * ```tsx
 * <AIOperatorSlide />
 * ```
 */

export const AIOperatorSlide = () => (
  <MiniBrowserChrome className="h-full" dark={true} url="operator.vybekiit.com">
    <div className="flex h-full bg-[#0a0d13] text-[var(--text-soft)]">
      <aside className="flex w-11 shrink-0 flex-col items-center gap-4 border-white/8 border-e py-3">
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#f472b6] to-[#7c3aed]" />
        {RAIL_ICONS.map((Icon, index) => (
          <span
            className={index === 0 ? 'text-white' : 'text-white/35'}
            key={Icon.displayName === undefined ? index : Icon.displayName}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-white/8 border-b px-3 py-2.5">
          <span className="font-semibold text-sm text-white">Operator</span>
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400">
            Live
          </Badge>
        </div>

        <div className="px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/40">
            <Search className="h-3 w-3" strokeWidth={2} />
            Search tasks...
          </div>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-3 pb-3">
          {TICKETS.map((ticket) => (
            <li key={ticket.title}>
              <Card className="gap-0 border-white/8 bg-white/[0.03] py-0 shadow-none">
                <CardContent className="flex items-start gap-2.5 px-2.5 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/8 font-semibold text-xs text-white/70">
                    {ticket.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs text-white leading-tight">
                      {ticket.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/45 leading-tight">
                      {ticket.body}
                    </p>
                  </div>
                  <div className="mt-0.5 flex shrink-0 items-center gap-1.5 text-white/30">
                    <Check className="h-3 w-3" strokeWidth={2} />
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </MiniBrowserChrome>
);
