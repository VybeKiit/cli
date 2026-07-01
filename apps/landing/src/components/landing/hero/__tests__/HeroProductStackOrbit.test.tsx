import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroProductStackOrbit } from '@/components/landing/hero/HeroProductStackOrbit';
import { HERO_STACK_MARKS } from '@/data/brandMarks3d';

describe('HeroProductStackOrbit', () => {
  it('renders static orbit layer with one img per manifest entry', () => {
    render(<HeroProductStackOrbit />);
    expect(document.querySelector('.hero-product-stack-orbit')).toBeTruthy();
    expect(document.querySelectorAll('.hero-product-stack-item').length).toBe(
      HERO_STACK_MARKS.length,
    );
  });

  it('applies float class to every mark', () => {
    render(<HeroProductStackOrbit />);
    const floating = document.querySelectorAll('.hero-product-stack-item--float');
    expect(floating.length).toBe(HERO_STACK_MARKS.length);
  });
});
