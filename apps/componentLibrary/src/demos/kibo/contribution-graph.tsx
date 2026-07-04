'use client';

import { ContributionGraph } from '@/components/kibo/contribution-graph/index';

export default function ContributionGraphPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ContributionGraph>
        <span className="text-sm text-muted-foreground">Preview</span>
      </ContributionGraph>
    </div>
  );
}
