import { Dialog } from '@/components/ui/dialog';
import type { ReactNode } from 'react';

export interface SheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}

/**
 * Bottom-sheet equivalent that reuses the mobile dialog contract.
 *
 * @param props - Sheet visibility, copy, close callback, and optional body.
 * @returns The dialog-backed sheet.
 * @example
 * <Sheet open={open} onOpenChange={setOpen} title="Filters" />
 */
export const Sheet = (props: SheetProps) => <Dialog {...props} />;
