import type { ComponentType } from 'react';
import type { InspirationDirection } from '@/data/inspirations';
import {
  BeforeAfterLayout,
  BoldStatementLayout,
  ChecklistLayout,
  DirectorsChairLayout,
  QuietStackLayout,
  ReceiptMorLayout,
  SplitScreenLayout,
  TerminalToLiveLayout,
  ThreePlatformLayout,
  VibeCoderLayout,
} from './layouts';

type LayoutComponent = ComponentType<{ direction: InspirationDirection }>;

/** Maps inspiration slug → full-page layout component. */
export const INSPIRATION_LAYOUTS: Record<string, LayoutComponent> = {
  'terminal-to-live': TerminalToLiveLayout,
  'split-screen': SplitScreenLayout,
  'three-platform': ThreePlatformLayout,
  'receipt-mor': ReceiptMorLayout,
  'directors-chair': DirectorsChairLayout,
  checklist: ChecklistLayout,
  'vibe-coder': VibeCoderLayout,
  'before-after': BeforeAfterLayout,
  'quiet-stack': QuietStackLayout,
  'bold-statement': BoldStatementLayout,
};
