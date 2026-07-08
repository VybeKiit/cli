import { Download, KeyRound, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: '2FA status',
    value: 'Ready',
    detail: 'Authenticator setup',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Sessions',
    value: '4',
    detail: '2 trusted devices',
    icon: <LockKeyhole className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Recovery codes',
    value: '10',
    detail: 'Download once',
    icon: <KeyRound className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Risk checks',
    value: 'Clean',
    detail: 'No blocked attempts',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const securityItems = [
  {
    title: 'Two-factor authentication',
    description: 'Set up authenticator apps and backup login methods.',
    badge: '2FA',
  },
  {
    title: 'Active sessions',
    description: 'Review browsers, mobile devices, and extension sessions.',
    badge: 'Sessions',
  },
  {
    title: 'Recovery codes',
    description: 'Generate, download, and rotate backup codes.',
    badge: 'Codes',
  },
] as const;

const policyItems = [
  {
    title: 'Require re-authentication',
    description: 'Ask for password before sensitive account changes.',
    badge: 'Policy',
  },
  {
    title: 'Device trust',
    description: 'Mark trusted devices and show unknown device warnings.',
    badge: 'Device',
  },
  {
    title: 'Login alerts',
    description: 'Send alerts for suspicious sign-in attempts.',
    badge: 'Alerts',
  },
] as const;

/**
 * Render a source-backed account security page recipe.
 *
 * @returns A security settings page for sessions, 2FA, and recovery codes.
 * @example
 * const element = <AccountSecurityPage />;
 */
export const AccountSecurityPage = () => {
  // TODO: Load security sessions and recovery code status from the active auth provider.
  // TODO: Save security changes through audited account actions.
  return (
    <DemoQuickWinPage
      active="settings"
      badge="Security"
      detailItems={policyItems}
      detailTitle="Security policies"
      listDescription="A focused account-hardening surface for signed-in users."
      listItems={securityItems}
      listTitle="Account protection"
      metrics={metrics}
      primaryAction={{ label: 'Rotate codes', icon: <RefreshCw className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Download codes',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A security settings page for two-factor authentication, active sessions, trusted devices, and recovery codes."
      title="Account security"
      transition="scale"
      variantDescription="Security settings need visible risk states, backup paths, and clear session controls."
      variantItems={policyItems}
      variantTitle="Security component variants"
    />
  );
};
