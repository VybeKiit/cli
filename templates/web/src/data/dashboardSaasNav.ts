import type { SaasIconName } from '@/data/saasPageTypes';

const DASHBOARD_NAV_LINKS: readonly {
  readonly href: string;
  readonly label: string;
  readonly icon: SaasIconName;
}[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'activity' },
  { href: '/dashboard/settings', label: 'User settings', icon: 'settings' },
  { href: '/dashboard/teams', label: 'Team', icon: 'users' },
  { href: '/dashboard/products', label: 'Products', icon: 'package' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'cart' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: 'plug' },
  { href: '/dashboard/admin', label: 'Admin', icon: 'shield' },
  { href: '/dashboard/support', label: 'Support', icon: 'life-buoy' },
  { href: '/dashboard/status', label: 'Status', icon: 'activity' },
  { href: '/dashboard/changelog', label: 'Changelog', icon: 'sparkles' },
];

export { DASHBOARD_NAV_LINKS };
