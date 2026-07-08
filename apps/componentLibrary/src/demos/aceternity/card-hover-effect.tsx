'use client';

import {
  Card,
  CardDescription,
  CardTitle,
  HoverEffect,
} from '@/components/aceternity/ui/card-hover-effect';

export default function CardHoverEffectPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <HoverEffect />
      <Card />
      <CardTitle />
      <CardDescription />
    </div>
  );
}
