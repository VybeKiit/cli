import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import type { ExtensionView } from '@/lib/view';
import { cn } from '@/lib/utils';

const VIEWS: readonly ExtensionView[] = ['home', 'login', 'pricing'];

const VIEW_KEYS: Record<ExtensionView, string> = {
  home: 'nav_home',
  login: 'nav_login',
  pricing: 'nav_pricing',
};

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
      compact ? 'flex-col' : 'flex-row',
    )}
    aria-label={t('nav_label')}
  >
    {VIEWS.map((view) => (
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
      className={cn('flex-1', compact && 'w-full')}
      onClick={handleClick}
    >
      {t(VIEW_KEYS[view])}
    </Button>
  );
};

export { AppNav };
