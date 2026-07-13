import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from '@/components/sections/Hero';
import { HERO } from '@/data/landingContent';

describe('Hero', () => {
  it('renders the split headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HERO.headline);
    expect(screen.getByText(HERO.headlineAccent)).toBeInTheDocument();
  });

  it('renders both install buttons', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /add to chrome/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add to edge/i })).toBeInTheDocument();
  });
});
