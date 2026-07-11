import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-destructive');
  });

  it('renders the child element via Slot when asChild is set', () => {
    render(
      <Button asChild={true}>
        <a href="/pricing">Pricing</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
