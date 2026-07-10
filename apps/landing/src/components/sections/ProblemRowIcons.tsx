import { cn } from '@/lib/utils';

export type ProblemRowId = 'payments' | 'auth' | 'database' | 'deploy' | 'you';

interface ProblemRowIconProps {
  readonly id: ProblemRowId;
  readonly className?: string;
}

/**
 * Custom SVG mark for one problem-overview row (payments, auth, db, deploy, you).
 *
 * @param props - Row id and optional className.
 * @returns Inline SVG icon.
 */
export const ProblemRowIcon = ({ id, className }: ProblemRowIconProps) => {
  const base = cn('size-4 shrink-0', className);

  if (id === 'payments') {
    return (
      <svg aria-hidden={true} className={base} fill="none" viewBox="0 0 16 16">
        <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.4" width="14" x="1" y="3" />
        <path d="M1 6.5h14" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 10h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (id === 'auth') {
    return (
      <svg aria-hidden={true} className={base} fill="none" viewBox="0 0 16 16">
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="10" x="3" y="7" />
        <path
          d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <circle cx="8" cy="10.5" fill="currentColor" r="1" />
      </svg>
    );
  }

  if (id === 'database') {
    return (
      <svg aria-hidden={true} className={base} fill="none" viewBox="0 0 16 16">
        <ellipse cx="8" cy="4" rx="5.5" ry="2.2" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2.5 4v4c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2V4"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M2.5 8v4c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2V8"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  if (id === 'deploy') {
    return (
      <svg aria-hidden={true} className={base} fill="none" viewBox="0 0 16 16">
        <path
          d="M3 11.5c1.8-4.2 3.6-6.6 5.2-7.4.6 1.6.8 3.6.6 5.6L11.8 8l-.8 3.2-3.2-.6c-1.2 1.4-2.4 2-4 2.2z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.35"
        />
        <path d="M2.5 13.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
      </svg>
    );
  }

  // you — stressed person mark
  return (
    <svg aria-hidden={true} className={base} fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 13.5c.6-2.6 2.2-4 4.5-4s3.9 1.4 4.5 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M11.5 3.2l1.2-1.2M12.8 5.2h1.5M11.6 7l1.1 1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  );
};
