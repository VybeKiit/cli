import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  /** Card heading, e.g. "Welcome back". */
  title: string;
  /** Supporting line under the title. */
  description: string;
  /** The form (or other body content) rendered inside the card. */
  children: ReactNode;
  /** Optional line under the card, e.g. a link to the opposite auth action. */
  footer?: ReactNode;
}

/** Centered card layout shared by the sign-in, sign-up, and verify screens. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link href="/" className="mb-6 font-semibold text-lg">
        My App
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
      </Card>
      {footer ? <div className="mt-4 text-muted-foreground text-sm">{footer}</div> : null}
    </main>
  );
}
