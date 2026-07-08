'use client';

import { X } from 'lucide-react';
import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { cn } from './utils';

interface FloatingPanelProps {
  readonly children?: ReactNode;
  readonly title?: string;
  readonly defaultPosition?: { readonly x: number; readonly y: number };
  readonly onClose?: () => void;
  readonly className?: string;
}

/**
 * Resolve the visible panel title.
 *
 * @param title - Optional caller-provided title.
 * @returns The caller title, or the default panel title.
 * @example
 * resolvePanelTitle(undefined) === 'Panel';
 */
const resolvePanelTitle = (title: string | undefined): string => {
  if (title === undefined) {
    return 'Panel';
  }
  return title;
};

/**
 * Floating overlay panel that can be positioned and dragged.
 *
 * @param props - Panel content, optional title, initial position, close handler, and classes.
 * @returns A draggable fixed-position panel.
 * @example
 * <FloatingPanel title="Inspector">Details</FloatingPanel>;
 */
export const FloatingPanel = (props: FloatingPanelProps) => {
  const { children = null, title, defaultPosition = { x: 20, y: 20 }, onClose, className = '' } = props;
  const [pos, setPos] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      setDragging(true);
      offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      const handleMove = (ev: globalThis.MouseEvent) => {
        setPos({ x: ev.clientX - offsetRef.current.x, y: ev.clientY - offsetRef.current.y });
      };
      const handleUp = () => {
        setDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [pos],
  );

  return (
    <div
      className={cn(
        'fixed z-50 rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl backdrop-blur-md',
        dragging && 'cursor-grabbing',
        className,
      )}
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-zinc-800 px-3 py-2"
        onMouseDown={handleMouseDown}
      >
        <span className="text-xs font-medium text-zinc-300">{resolvePanelTitle(title)}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
};
