import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardGuard } from '@/components/dashboard-guard';
import { useUser } from '@/hooks/useUser';
import { useRouter } from '@/i18n/navigation';

vi.mock('@/i18n/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

describe('DashboardGuard', () => {
  it('redirects signed-out visitors to /login', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useUser).mockReturnValue({ user: null, loading: false });

    render(
      <DashboardGuard>
        <div>Protected</div>
      </DashboardGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('renders children when a user is signed in', () => {
    vi.mocked(useRouter).mockReturnValue({ replace: vi.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(useUser).mockReturnValue({
      user: { id: 'u_1', email: 'builder@example.com' },
      loading: false,
    });

    const { getByText } = render(
      <DashboardGuard>
        <div>Protected</div>
      </DashboardGuard>,
    );

    expect(getByText('Protected')).toBeInTheDocument();
  });
});
