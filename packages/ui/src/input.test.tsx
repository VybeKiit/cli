import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders a textbox with the given placeholder', () => {
    render(<Input placeholder="Email" aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('placeholder', 'Email');
  });

  it('forwards disabled state', () => {
    render(<Input disabled={true} aria-label="Name" />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
  });
});
