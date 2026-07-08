'use client';

import { AnimatedBadge } from '@/components/blocks/21st/be-ui-animated-badge';

export default function BeUiAnimatedBadgePreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-4 p-6">
      <AnimatedBadge status="success">Live</AnimatedBadge>
      <AnimatedBadge status="loading">Syncing</AnimatedBadge>
      <AnimatedBadge status="warning">Beta</AnimatedBadge>
      <AnimatedBadge status="neutral">Draft</AnimatedBadge>
    </div>
  );
}
