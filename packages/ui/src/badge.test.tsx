import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its label text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies the secondary variant class', () => {
    render(<Badge variant="secondary">Beta</Badge>);
    expect(screen.getByText('Beta')).toHaveClass('bg-secondary');
  });
});
