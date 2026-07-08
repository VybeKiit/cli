import { Button } from '@/components/ui/button';
import { EXTENSION_SAAS_SCREENS } from '@/data/saasScreens';
import { t } from '@/lib/i18n';
import type { ExtensionView } from '@/lib/view';
import { cn } from '@/lib/utils';

const POPUP_VIEWS: readonly ExtensionView[] = ['home', 'login', 'pricing'];

const VIEW_KEYS: Record<ExtensionView, string> = {
  home: 'nav_home',
  login: 'nav_login',
  pricing: 'nav_pricing',
  dashboard: 'nav_dashboard',
  products: 'nav_products',
  settings: 'nav_settings',
  status: 'nav_status',
  changelog: 'nav_changelog',
  admin: 'nav_admin',
};

const SIDE_PANEL_VIEWS: readonly ExtensionView[] = [
  ...EXTENSION_SAAS_SCREENS.map((screen) => screen.view),
  'login',
  'pricing',
];

interface AppNavProps {
  readonly active: ExtensionView;
  readonly onChange: (view: ExtensionView) => void;
  readonly compact?: boolean;
  readonly marketing?: boolean;
}

/**
 * Render the shared extension view navigation.
 *
 * @param props - Active view, change callback, and layout flags.
 * @returns Navigation buttons for the extension screens.
 * @example
 * <AppNav active="home" onChange={setView} />
 */
const AppNav = ({ active, onChange, compact = false, marketing = false }: AppNavProps) => (
  <nav
    className={cn(
      'flex gap-1 border-t p-2',
      marketing ? 'border-white/10 bg-[#03070d]' : 'border-border bg-background',
      compact ? 'flex-col' : 'flex-row flex-wrap',
    )}
    aria-label={t('nav_label')}
  >
    {(marketing ? POPUP_VIEWS : SIDE_PANEL_VIEWS).map((view) => (
      <AppNavButton active={active} compact={compact} key={view} onChange={onChange} view={view} />
    ))}
  </nav>
);

interface AppNavButtonProps {
  readonly active: ExtensionView;
  readonly compact: boolean;
  readonly onChange: (view: ExtensionView) => void;
  readonly view: ExtensionView;
}

/**
 * Render one extension view button.
 *
 * @param props - Active view, target view, layout flag, and change callback.
 * @returns A navigation button for one extension view.
 * @example
 * <AppNavButton active="home" compact={false} view="pricing" onChange={setView} />
 */
const AppNavButton = ({ active, compact, onChange, view }: AppNavButtonProps) => {
  const handleClick = (): void => {
    onChange(view);
  };

  return (
    <Button
      key={view}
      type="button"
      size="sm"
      variant={active === view ? 'default' : 'outline'}
      className={cn(compact ? 'w-full' : 'min-w-28 flex-1')}
      onClick={handleClick}
    >
      <span aria-hidden="true">{active === view ? '•' : '›'}</span>
      {t(VIEW_KEYS[view])}
    </Button>
  );
};

export { AppNav };
