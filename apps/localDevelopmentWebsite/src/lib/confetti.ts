import confetti from 'canvas-confetti';

/** Celebrate a completed workflow with a confetti burst. */
/**
 * Celebrate.
 *
 * @returns Nothing; the helper triggers a confetti animation.
 * @example
 * celebrate();
 */
export const celebrate = (): void => {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 100,
  };

  const fire = (particleRatio: number, opts: confetti.Options): void => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(200 * particleRatio),
    });
  };

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#8b5cf6', '#7c3aed'] });
  fire(0.2, { spread: 60, colors: ['#a78bfa', '#10b981'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#c4b5fd', '#34d399'] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ddd6fe'] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ['#8b5cf6', '#10b981'] });
};
