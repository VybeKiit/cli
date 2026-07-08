'use client';

import {
  Modal,
  ModalBody,
  ModalProvider,
  ModalTrigger,
} from '@/components/aceternity/ui/animated-modal';

export default function AnimatedModalPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <ModalProvider />
      <Modal />
      <ModalTrigger />
      <ModalBody />
    </div>
  );
}
