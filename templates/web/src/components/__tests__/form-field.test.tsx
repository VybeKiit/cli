import { FormField } from '@/components/form-field';
import { render, screen } from '@testing-library/react';
import { useId } from 'react';

const TestField = ({
  error = '',
  label = 'Email',
}: {
  readonly error?: string;
  readonly label?: string;
}) => {
  const id = useId();
  return <FormField error={error} id={id} label={label} />;
};

describe('FormField', () => {
  it('ties the label to the input via htmlFor/id', () => {
    render(<TestField />);
    const input = screen.getByLabelText('Email');
    expect(input.id).toBeTruthy();
  });

  it('shows the error and wires aria-invalid / aria-describedby when present', () => {
    render(<TestField error="Enter a valid email." />);
    const input = screen.getByLabelText('Email');
    const message = screen.getByText('Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', `${input.id}-error`);
    expect(message).toHaveAttribute('id', `${input.id}-error`);
  });

  it('renders no error and no aria wiring when there is no error', () => {
    const { container } = render(<TestField />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(container.ownerDocument.getElementById(`${input.id}-error`)).toBeNull();
  });
});
