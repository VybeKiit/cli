'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentSessionDemo } from '@/components/inspirations/agent-session-demo';
import type { InspirationDirection } from '@/data/inspirations';
import { InspirationChrome, InspirationCta } from './inspiration-chrome';

const VERIFY_STEPS = ['Auth', 'Database', 'Payments', 'Deploy', 'Live app'] as const;

const KINETIC_VERBS = ['ships itself', 'tests itself', 'updates itself', 'takes payments'] as const;

const BUNDLE_PLATFORMS = [
  { label: 'Web App', icon: '💻' },
  { label: 'Mobile App', icon: '📱' },
  { label: 'Browser Extension', icon: '🧩' },
] as const;

const CHAOS_ITEMS = [
  'Stripe docs (tab 14)',
  'DATABASE_URL=???',
  'deploy failed — exit 1',
  'git merge conflict',
] as const;

const AGENT_TIMELINE = ['Describe your product', 'Agent builds', 'Payments live'] as const;

const STORYBOARD_SCENES = ['Wireframe', 'Checkout live', 'Deployed'] as const;

const STACK_PATH = ['Auth', 'Database', 'Payments', 'Deploy', 'Updates'] as const;

export function TerminalToLiveLayout({ direction }: { direction: InspirationDirection }) {
  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="flex flex-col gap-6">
          <p
            className="font-mono text-sm uppercase tracking-widest"
            style={{ color: direction.palette.accent }}
          >
            agent-as-operator
          </p>
          <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
            {direction.headline}
          </h1>
          <p className="text-balance text-lg" style={{ color: direction.palette.muted }}>
            {direction.subhead}
          </p>
          <InspirationCta direction={direction} />
        </div>
        <AgentSessionDemo />
      </section>
    </InspirationChrome>
  );
}

export function SplitScreenLayout({ direction }: { direction: InspirationDirection }) {
  return (
    <InspirationChrome direction={direction}>
      <section className="grid min-h-[80vh] lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 bg-neutral-200/80 p-8 lg:p-16">
          <span className="w-fit rounded-full bg-red-500/15 px-3 py-1 font-medium text-red-700 text-xs">
            builder alone
          </span>
          <ul className="space-y-2 text-sm">
            {CHAOS_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-neutral-600 line-through decoration-red-400/70"
              >
                <span className="text-red-500" aria-hidden={true}>
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-neutral-500 text-sm">scattered chores, no operator</p>
        </div>
        <div
          className="flex flex-col justify-center gap-6 p-8 lg:p-16"
          style={{ background: `linear-gradient(135deg, ${direction.palette.accent}15, #ECFDF5)` }}
        >
          <h1 className="text-balance font-bold text-3xl sm:text-4xl">{direction.headline}</h1>
          <p className="text-balance text-lg" style={{ color: direction.palette.muted }}>
            {direction.subhead}
          </p>
          <ol className="space-y-3">
            {AGENT_TIMELINE.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs"
                  style={{ background: direction.palette.accent, color: '#fff' }}
                >
                  {i + 1}
                </span>
                <span className={i === AGENT_TIMELINE.length - 1 ? 'font-semibold' : ''}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function ThreePlatformLayout({ direction }: { direction: InspirationDirection }) {
  const [unwrapped, setUnwrapped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setUnwrapped(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <InspirationChrome direction={direction}>
      <section
        className="relative overflow-hidden px-6 py-20 text-center sm:py-28"
        style={{ background: `linear-gradient(180deg, ${direction.palette.bg}, #E0E7FF)` }}
      >
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8">
          <h1 className="max-w-2xl text-balance font-bold text-4xl tracking-tight sm:text-6xl">
            {direction.headline}
          </h1>
          <p className="max-w-lg text-balance text-lg" style={{ color: direction.palette.muted }}>
            {direction.subhead}
          </p>
          <div className="relative mt-4 min-h-[220px] w-full max-w-2xl">
            {unwrapped ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {BUNDLE_PLATFORMS.map((platform, i) => (
                  <div
                    key={platform.label}
                    className="vybe-line-in rounded-xl border-2 bg-white/95 p-5 shadow-lg"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      borderColor: direction.palette.accent,
                    }}
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <p className="mt-2 font-semibold text-sm">{platform.label}</p>
                    <span
                      className="mt-2 inline-block rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide"
                      style={{
                        background: `${direction.palette.accent}22`,
                        color: direction.palette.accent,
                      }}
                    >
                      agent-ready
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUnwrapped(true)}
                className="mx-auto flex size-32 flex-col items-center justify-center rounded-2xl border-4 font-bold text-2xl shadow-xl transition-transform hover:scale-105"
                style={{
                  borderColor: direction.palette.accent,
                  background: '#fff',
                  color: direction.palette.accent,
                }}
              >
                $29
                <span className="mt-1 font-normal text-xs">tap to unwrap</span>
              </button>
            )}
          </div>
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function ReceiptMorLayout({ direction }: { direction: InspirationDirection }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCollapsed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 py-20 lg:flex-row lg:py-28">
        <div
          className="w-full max-w-sm rotate-1 rounded-sm border-2 border-dashed bg-white p-8 shadow-lg lg:-rotate-2"
          style={{ borderColor: direction.palette.accent }}
        >
          <p className="text-center font-bold text-lg">INVOICE</p>
          <hr className="my-4 border-dashed" />
          {collapsed ? (
            <div
              className="vybe-line-in rounded-lg px-4 py-3 text-center font-semibold text-green-800"
              style={{ background: `${direction.palette.accent}22` }}
            >
              Merchant of Record handled ✓
            </div>
          ) : (
            <div className="space-y-2 font-mono text-sm transition-all">
              <div className="flex justify-between text-neutral-500">
                <span>VAT filing (EU)</span>
                <span>???</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Sales tax (US states)</span>
                <span>???</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>MoR setup</span>
                <span>???</span>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-between font-mono text-sm">
            <span>VybeKiit</span>
            <span>$29.00</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-balance font-bold text-4xl sm:text-5xl">{direction.headline}</h1>
          <p className="text-balance text-lg" style={{ color: direction.palette.muted }}>
            {direction.subhead}
          </p>
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function DirectorsChairLayout({ direction }: { direction: InspirationDirection }) {
  return (
    <InspirationChrome direction={direction}>
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center top, ${direction.palette.accent}33 0%, transparent 60%)`,
          }}
        />
        <h1 className="relative max-w-3xl text-balance text-center font-bold text-4xl sm:text-5xl">
          {direction.headline}
        </h1>
        <p
          className="relative mt-4 max-w-xl text-balance text-center text-lg"
          style={{ color: direction.palette.muted }}
        >
          {direction.subhead}
        </p>
        <div
          className="relative mt-10 w-full max-w-lg rounded-xl border-2 p-6 text-start shadow-xl"
          style={{
            borderColor: direction.palette.accent,
            background: `${direction.palette.accent}11`,
          }}
        >
          <p
            className="mb-1 font-mono text-xs uppercase tracking-widest"
            style={{ color: direction.palette.accent }}
          >
            Your instruction
          </p>
          <p className="text-balance font-medium text-lg">
            &ldquo;I want a booking app for dog groomers&rdquo;
          </p>
        </div>
        <div className="relative mt-8 flex w-full max-w-2xl flex-wrap justify-center gap-3">
          {STORYBOARD_SCENES.map((scene, i) => (
            <div
              key={scene}
              className="vybe-check-item flex min-w-[100px] flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3"
              style={{
                animationDelay: `${400 + i * 200}ms`,
                borderColor: `${direction.palette.accent}55`,
              }}
            >
              <span className="font-mono text-xs" style={{ color: direction.palette.accent }}>
                Scene {i + 1}
              </span>
              <span className="font-medium text-sm">{scene}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-10">
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function ChecklistLayout({ direction }: { direction: InspirationDirection }) {
  const [unlocked, setUnlocked] = useState(0);

  useEffect(() => {
    if (unlocked >= VERIFY_STEPS.length) {
      return;
    }
    const t = setTimeout(() => setUnlocked((n) => n + 1), 700);
    return () => clearTimeout(t);
  }, [unlocked]);

  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center lg:py-28">
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
            {direction.headline}
          </h1>
          <p className="text-balance text-lg" style={{ color: direction.palette.muted }}>
            {direction.subhead}
          </p>
          <InspirationCta direction={direction} />
        </div>
        <ol className="flex flex-1 flex-col gap-3">
          {VERIFY_STEPS.map((step, i) => {
            const done = i < unlocked;
            return (
              <li
                key={step}
                className="flex items-center gap-4 rounded-xl border px-5 py-4 transition-all"
                style={{
                  borderColor: done ? direction.palette.accent : `${direction.palette.muted}44`,
                  opacity: done ? 1 : 0.45,
                  background:
                    done && i === unlocked - 1 ? `${direction.palette.accent}11` : 'transparent',
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-xs"
                  style={{
                    background: done ? direction.palette.accent : `${direction.palette.muted}33`,
                    color: done ? '#fff' : direction.palette.muted,
                  }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="flex-1">{step}</span>
                {done ? (
                  <span
                    className="vybe-line-in rounded px-2 py-0.5 font-bold text-[10px] uppercase tracking-wide"
                    style={{
                      background: `${direction.palette.accent}22`,
                      color: direction.palette.accent,
                    }}
                  >
                    tested
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: direction.palette.muted }}>
                    locked
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </InspirationChrome>
  );
}

export function VibeCoderLayout({ direction }: { direction: InspirationDirection }) {
  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <p
          className="text-balance font-bold text-3xl leading-snug sm:text-5xl"
          style={{ color: direction.palette.fg, fontFamily: 'Georgia, serif' }}
        >
          &ldquo;Describe the product like a voice note.&rdquo;
        </p>
        <p
          className="mt-6 max-w-xl text-balance text-lg"
          style={{ color: direction.palette.muted }}
        >
          {direction.subhead}
        </p>
        <div
          className="mt-10 rounded-3xl border-2 border-dashed p-8"
          style={{ borderColor: `${direction.palette.accent}44`, background: direction.palette.bg }}
        >
          <h1 className="text-balance font-bold text-2xl sm:text-3xl">{direction.headline}</h1>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="rounded-2xl rounded-bl-sm bg-white px-6 py-4 font-medium text-lg shadow-md"
              style={{ color: direction.palette.fg }}
            >
              make me a booking app
            </div>
            <span className="hidden text-2xl sm:inline">→</span>
            <div
              className="rounded-full px-4 py-2 font-mono text-sm"
              style={{ background: direction.palette.accent, color: '#fff' }}
            >
              yourapp.com ✓ live
            </div>
          </div>
          <div className="mt-10">
            <InspirationCta direction={direction} />
          </div>
        </div>
      </section>
    </InspirationChrome>
  );
}

export function BeforeAfterLayout({ direction }: { direction: InspirationDirection }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) {
      return;
    }
    const start = 20;
    const end = 78;
    const steps = 30;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      setPosition(start + ((end - start) * step) / steps);
      if (step >= steps) {
        clearInterval(id);
      }
    }, 60);
    return () => clearInterval(id);
  }, [hasInteracted]);

  const onMove = useCallback((clientX: number) => {
    setHasInteracted(true);
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    setPosition(Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <h1 className="mb-4 text-balance text-center font-bold text-4xl sm:text-5xl">
          {direction.headline}
        </h1>
        <p
          className="mb-10 text-balance text-center text-lg"
          style={{ color: direction.palette.muted }}
        >
          {direction.subhead}
        </p>
        <div
          ref={containerRef}
          className="relative aspect-[16/10] cursor-ew-resize select-none overflow-hidden rounded-2xl border shadow-xl"
          style={{ borderColor: direction.palette.muted }}
          onPointerDown={(e) => {
            onMove(e.clientX);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1) {
              return;
            }
            onMove(e.clientX);
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/80 p-8">
            <p className="font-medium text-amber-900/70 text-sm uppercase tracking-wide">Day 1</p>
            <div className="mt-3 w-full max-w-xs rounded-lg border border-amber-200 bg-white p-4 shadow-inner">
              <p className="font-medium text-amber-950 text-sm">Notes</p>
              <p className="mt-2 text-amber-800/80 text-xs italic">idea: meal plan app, $9/mo…</p>
              <p className="mt-1 text-amber-800/50 text-xs">— still just an idea</p>
            </div>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
            style={{
              background: 'linear-gradient(135deg, #FED7AA, #FEF3C7)',
              clipPath: `inset(0 ${100 - position}% 0 0)`,
            }}
          >
            <p className="font-semibold text-orange-900 text-sm uppercase tracking-wide">
              Session 1
            </p>
            <p className="mt-2 font-bold text-orange-950 text-xl">Live app + payment toast</p>
            <div className="mt-4 rounded-lg bg-white px-4 py-2 shadow-lg">
              <p
                className={`font-mono text-green-700 text-sm ${position > 70 ? 'vybe-line-in' : 'opacity-0'}`}
              >
                +$9.00 · first payment
              </p>
            </div>
          </div>
          <div
            className="absolute inset-y-0 z-10 w-1 bg-white shadow-lg"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          />
          <div
            className="absolute top-1/2 z-20 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg"
            style={{ left: `${position}%` }}
          >
            ↔
          </div>
        </div>
        <p className="mt-4 text-center text-sm" style={{ color: direction.palette.muted }}>
          Drag to compare
        </p>
        <div className="mt-10 flex justify-center">
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function QuietStackLayout({ direction }: { direction: InspirationDirection }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % (STACK_PATH.length + 1));
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <InspirationChrome direction={direction}>
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <h1 className="text-balance text-center font-bold text-4xl sm:text-5xl">
          {direction.headline}
        </h1>
        <p
          className="mx-auto mt-4 max-w-xl text-balance text-center text-lg"
          style={{ color: direction.palette.muted }}
        >
          {direction.subhead}
        </p>
        <div className="mx-auto mt-16 max-w-2xl overflow-x-auto pb-4">
          <div className="flex min-w-max items-center gap-2 sm:gap-3">
            {STACK_PATH.map((label, i) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3">
                <div
                  className="rounded-lg border px-3 py-3 font-mono text-xs uppercase tracking-wide transition-all sm:px-4"
                  style={{
                    borderColor:
                      i <= activeIndex ? direction.palette.accent : `${direction.palette.muted}44`,
                    background: i === activeIndex ? `${direction.palette.accent}22` : 'transparent',
                    opacity: i <= activeIndex ? 1 : 0.35,
                    color: i <= activeIndex ? direction.palette.fg : direction.palette.muted,
                  }}
                >
                  {label}
                </div>
                {i < STACK_PATH.length - 1 ? (
                  <span
                    style={{ color: direction.palette.muted, opacity: i < activeIndex ? 1 : 0.3 }}
                  >
                    →
                  </span>
                ) : null}
              </div>
            ))}
            {activeIndex >= STACK_PATH.length ? (
              <span
                className="vybe-line-in ms-2 rounded-full px-3 py-1 font-bold text-xs"
                style={{ background: direction.palette.accent, color: '#fff' }}
              >
                agent operates it
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <InspirationCta direction={direction} />
        </div>
      </section>
    </InspirationChrome>
  );
}

export function BoldStatementLayout({ direction }: { direction: InspirationDirection }) {
  const [verbIndex, setVerbIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVerbIndex((i) => (i + 1) % KINETIC_VERBS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <InspirationChrome direction={direction}>
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 py-20 text-center">
        <h1
          className="max-w-5xl text-balance font-black text-5xl leading-[0.95] tracking-tighter sm:text-8xl"
          style={{ color: direction.palette.fg }}
        >
          The SaaS kit that{' '}
          <span
            key={verbIndex}
            className="vybe-line-in vybe-glow-accent inline-block italic"
            style={{ color: direction.palette.accent }}
          >
            {KINETIC_VERBS[verbIndex]}.
          </span>
        </h1>
        <p
          className="mt-8 max-w-lg text-balance text-lg"
          style={{ color: direction.palette.muted }}
        >
          {direction.subhead}
        </p>
        <div className="mt-12">
          <InspirationCta direction={direction} />
        </div>
        <ul
          className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
          style={{ color: direction.palette.muted }}
        >
          <li>Lemon Squeezy</li>
          <li>14-day refund</li>
          <li>web · mobile · extension</li>
        </ul>
      </section>
    </InspirationChrome>
  );
}
