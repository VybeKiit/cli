'use client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const STATS = [
  { label: 'Users', value: '9,248', delta: '+8.2%', up: true },
  { label: 'MRR', value: '$1,290', delta: '-2.4%', up: false },
] as const;

/** Mobile App carousel slide — native dashboard inside a phone frame. */
export function MobileAppSlide() {
  return (
    <div className="flex h-full items-center justify-center bg-[#03070d] p-3">
      <div className="flex h-full max-h-[430px] w-full max-w-[240px] flex-col rounded-[30px] border-[3px] border-[#1b1f26] bg-[#050810] p-2 shadow-2xl">
        <div className="flex items-center justify-between px-3 pt-1 pb-2 text-[9px] text-white/70">
          <span className="font-semibold">9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2.5 rounded-[1px] bg-white/60" />
            <span className="h-2 w-2 rounded-full border border-white/60" />
            <span className="h-2 w-3.5 rounded-[2px] border border-white/60" />
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-[22px] bg-[#080d16] px-3.5 pt-3 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-[13px] text-white">Dashboard</p>
            <span className="flex items-center gap-1.5 text-white/40">
              <span className="h-3.5 w-3.5 rounded-full border border-white/30" />
              <span className="h-3.5 w-3.5 rounded-full border border-white/30" />
            </span>
          </div>

          <p className="text-[9px] text-white/45">Total Revenue</p>
          <div className="flex items-end gap-2">
            <p className="font-bold text-[22px] text-white leading-none">$24,880</p>
            <span className="mb-0.5 text-[9px] text-[var(--green)]">+12.5%</span>
          </div>

          <svg aria-hidden="true" className="mt-3 h-20 w-full" preserveAspectRatio="none" viewBox="0 0 200 70">
            <defs>
              <linearGradient id="mobile-spark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,52 C20,50 30,40 50,42 C70,44 80,24 100,30 C120,36 130,14 150,20 C170,26 185,10 200,14 L200,70 L0,70 Z"
              fill="url(#mobile-spark)"
            />
            <path
              d="M0,52 C20,50 30,40 50,42 C70,44 80,24 100,30 C120,36 130,14 150,20 C170,26 185,10 200,14"
              fill="none"
              stroke="var(--blue-soft)"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[7px] text-white/30">
            {DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <p className="mt-3 mb-1.5 font-semibold text-[10px] text-white/80">Overview</p>
          <div className="grid grid-cols-2 gap-2">
            {STATS.map((stat) => (
              <div className="rounded-xl bg-white/[0.04] p-2.5" key={stat.label}>
                <p className="text-[8px] text-white/40">{stat.label}</p>
                <p className="font-bold text-[13px] text-white leading-tight">{stat.value}</p>
                <p className={stat.up ? 'text-[8px] text-[var(--green)]' : 'text-[8px] text-[#f87171]'}>
                  {stat.delta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
