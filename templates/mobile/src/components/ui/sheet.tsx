import { Dialog } from '@/components/ui/dialog';
import type { ReactNode } from 'react';

/** Bottom-leaning sheet — reuses Dialog on mobile for parity with web Sheet. */
export function Sheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return <Dialog {...props} />;
}
