import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Hero } from '@/components/sections/Hero';

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Everything you need.');
    expect(heading.textContent).toContain('app');
  });
});
