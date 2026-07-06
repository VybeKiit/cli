'use client';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from './utils';

type AgentAvatarProps = {
  src?: string;
  name: string;
  status?: 'online' | 'busy' | 'idle' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const STATUS_RING = {
  online: 'ring-emerald-500 shadow-[0_0_6px_#22c55e66]',
  busy: 'ring-orange-500 shadow-[0_0_6px_#f9731666]',
  idle: 'ring-yellow-500 shadow-[0_0_6px_#eab30866]',
  offline: 'ring-zinc-600',
};

const STATUS_DOT = {
  online: 'bg-emerald-500',
  busy: 'bg-orange-500',
  idle: 'bg-yellow-500',
  offline: 'bg-zinc-600',
};

const SIZE_MAP = {
  sm: { ring: 'h-7 w-7', dot: 'h-2 w-2 -right-0 -bottom-0', text: 'text-[10px]' },
  md: { ring: 'h-9 w-9', dot: 'h-2.5 w-2.5 -right-0.5 -bottom-0.5', text: 'text-xs' },
  lg: { ring: 'h-12 w-12', dot: 'h-3 w-3 -right-0.5 -bottom-0.5', text: 'text-sm' },
};

/** Agent avatar with animated status ring. Extends the base Avatar primitive. */
export const AgentAvatar = ({
  src,
  name,
  status = 'offline',
  size = 'md',
  className,
}: AgentAvatarProps) => {
  const s = SIZE_MAP[size];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative inline-flex', className)}>
      <Avatar className={cn('ring-2', s.ring, STATUS_RING[status])}>
        {src ? (
          <AvatarImage src={src} alt={name} />
        ) : (
          <AvatarFallback className={s.text}>{initials}</AvatarFallback>
        )}
      </Avatar>
      <span
        className={cn('absolute rounded-full border-2 border-zinc-900', s.dot, STATUS_DOT[status])}
      />
    </div>
  );
};
