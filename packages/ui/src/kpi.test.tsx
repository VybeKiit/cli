import { render, screen } from '@testing-library/react';
import { Kpi } from './kpi';

describe('Kpi', () => {
  it('renders label and value in stack layout by default', () => {
    render(<Kpi label="Open" value={12} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="kpi"]')).toHaveAttribute('data-layout', 'stack');
  });

  it('uses row layout when an icon is provided without a hint', () => {
    render(<Kpi icon={<span data-testid="icon" />} label="Customers" value="1.2k" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('1.2k')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="kpi"]')).toHaveAttribute('data-layout', 'row');
  });

  it('renders an optional hint under the value', () => {
    render(<Kpi label="MRR" value="$12k" hint="vs last month" />);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
});
