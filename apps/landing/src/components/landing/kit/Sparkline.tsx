interface SparklineProps {
  readonly id: string;
  readonly className?: string;
}

/** Shared revenue sparkline for dashboard mockups. */
export function Sparkline({ id, className }: SparklineProps) {
  return (
    <svg aria-hidden="true" className={className} preserveAspectRatio="none" viewBox="0 0 220 60">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,46 C25,44 35,38 55,40 C80,42 90,30 110,28 C135,26 150,20 175,16 C195,13 210,9 220,7 L220,60 L0,60 Z"
        fill={`url(#${id})`}
      />
      <path
        d="M0,46 C25,44 35,38 55,40 C80,42 90,30 110,28 C135,26 150,20 175,16 C195,13 210,9 220,7"
        fill="none"
        stroke="var(--blue)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}
