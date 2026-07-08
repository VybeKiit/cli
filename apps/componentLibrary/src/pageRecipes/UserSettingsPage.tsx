import { Eye, Save, Settings, ShieldCheck, User } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Profile fields',
    value: '8',
    detail: 'Ready to edit',
    icon: <User className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Security',
    value: '2FA',
    detail: 'Recommended next',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Sessions',
    value: '4',
    detail: 'Active devices',
    icon: <Settings className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Privacy',
    value: 'On',
    detail: 'Export available',
    icon: <Eye className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const profileItems = [
  {
    title: 'Personal profile',
    description: 'Name, avatar, timezone, and preferred contact email.',
    badge: 'Profile',
  },
  {
    title: 'Connected accounts',
    description: 'Google, GitHub, and password sign-in methods in one place.',
    badge: 'Auth',
  },
  {
    title: 'Danger zone',
    description: 'Export data, deactivate account, and delete-account confirmation states.',
    badge: 'Safety',
  },
] as const;

const settingItems = [
  {
    title: 'Email updates',
    description: 'Product, billing, and security messages.',
    badge: 'Email',
  },
  {
    title: 'Session alerts',
    description: 'Notify the user when a new device signs in.',
    badge: 'Security',
  },
  {
    title: 'Public profile',
    description: 'Toggle whether team members can see profile metadata.',
    badge: 'Privacy',
  },
] as const;

/**
 * Render a source-backed user settings page recipe.
 *
 * @returns A profile, account, and preference settings page.
 * @example
 * const element = <UserSettingsPage />;
 */
export const UserSettingsPage = () => {
  // TODO: Load profile and preference data from the active account service.
  // TODO: Save settings changes through audited user actions.
  return (
    <DemoQuickWinPage
      active="settings"
      badge="Settings"
      detailItems={settingItems}
      detailTitle="Preference controls"
      listDescription="Common account controls every SaaS app needs after signup."
      listItems={profileItems}
      listTitle="Account sections"
      metrics={metrics}
      primaryAction={{ label: 'Save settings', icon: <Save className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Preview profile',
        icon: <Eye className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A complete user settings surface for profile, account access, sessions, privacy, and account deletion states."
      title="User settings"
      transition="slide"
      variantDescription="Profile pages need dense forms, security cues, and clear destructive-action boundaries."
      variantItems={settingItems}
      variantTitle="Settings component variants"
    />
  );
};
