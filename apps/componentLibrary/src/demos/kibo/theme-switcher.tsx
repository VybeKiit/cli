'use client';

import { ThemeSwitcher } from '@/components/kibo/theme-switcher/index';

export default function ThemeSwitcherPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ThemeSwitcher />
    </div>
  );
}
