import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';
import { AssistantChatDevShell } from '@/components/tools/assistant-chat/assistant-chat-shell';
import { BRAND } from '@/data/site';
import { resolveDirection } from '@/lib/direction';
import './globals.css';

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    'VybeKiit is the SaaS kit that ships itself. You describe the product in plain language; the agent builds it, deploys it, takes payments, and keeps it updated. Web, mobile, and a browser extension in one purchase.',
};

/**
 * Root layout for the store. Detects the visitor's language from the request and
 * sets `<html dir>` so RTL locales (Hebrew/Arabic) mirror automatically — see
 * `src/lib/direction.ts`. Copy stays English; the structure is RTL-safe.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { lang, dir } = resolveDirection((await headers()).get('accept-language'));
  return (
    <html lang={lang} dir={dir}>
      <body>
        {children}
        <ReportModeDevShell />
        <AssistantChatDevShell />
      </body>
    </html>
  );
}
