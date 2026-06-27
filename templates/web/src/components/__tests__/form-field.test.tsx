import { FormField } from '@/components/form-field';
import { render, screen } from '@testing-library/react';

describe('FormField', () => {
  it('ties the label to the input via htmlFor/id', () => {
    render(<FormField id="email" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('shows the error and wires aria-invalid / aria-describedby when present', () => {
    render(<FormField id="email" label="Email" error="Enter a valid email." />);
    const input = screen.getByLabelText('Email');
    const message = screen.getByText('Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(message).toHaveAttribute('id', 'email-error');
  });

  it('renders no error and no aria wiring when there is no error', () => {
    const { container } = render(<FormField id="email" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('#email-error')).toBeNull();
  });
});
