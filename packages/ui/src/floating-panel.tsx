'use client';

import { type ReactNode, useCallback, useRef, useState } from 'react';
import { cn } from './utils';

type FloatingPanelProps = {
  children: ReactNode;
  title?: string;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
};

/** Floating overlay panel that can be positioned and dragged. */
export const FloatingPanel = ({
  children,
  title,
  defaultPosition = { x: 20, y: 20 },
  onClose,
  className,
}: FloatingPanelProps) => {
  const [pos, setPos] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setDragging(true);
      offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      const handleMove = (ev: MouseEvent) => {
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
        <span className="text-xs font-medium text-zinc-300">{title ?? 'Panel'}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
};
