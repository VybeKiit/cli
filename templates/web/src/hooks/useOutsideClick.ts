import { useOutsideClick as useAceternityOutsideClick } from '@/components/aceternity/use-outside-click';

/**
 * Run a callback when the visitor clicks outside the referenced element.
 *
 * @param ref - Element ref that defines the inside boundary.
 * @param callback - Handler called with the outside pointer event.
 * @returns Nothing; the hook owns document listeners for its lifecycle.
 * @example
 * useOutsideClick(panelRef, () => setOpen(false));
 */
export const useOutsideClick = useAceternityOutsideClick;
