'use client';

import AuthLayout from '@/components/blocks/21st/smart-hover-auth-layout';

export default function SmartHoverAuthLayoutPreview() {
  return (
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-xl border">
      <AuthLayout>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Auth layout shell with animated background
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}
