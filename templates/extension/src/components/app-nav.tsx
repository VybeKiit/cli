import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import type { ExtensionView } from '@/lib/view';
import { cn } from '@/lib/utils';

const VIEWS: ExtensionView[] = ['home', 'login', 'pricing'];

const VIEW_KEYS: Record<ExtensionView, string> = {
  home: 'nav_home',
  login: 'nav_login',
  pricing: 'nav_pricing',
};

export function AppNav({
  active,
  onChange,
  compact = false,
}: {
  active: ExtensionView;
  onChange: (view: ExtensionView) => void;
  compact?: boolean;
}) {
  return (
    <nav
      className={cn(
        'flex gap-1 border-border border-t bg-background p-2',
        compact ? 'flex-col' : 'flex-row',
      )}
      aria-label={t('nav_label')}
    >
      {VIEWS.map((view) => (
        <Button
          key={view}
          type="button"
          size="sm"
          variant={active === view ? 'default' : 'outline'}
          className={cn('flex-1', compact && 'w-full')}
          onClick={() => onChange(view)}
        >
          {t(VIEW_KEYS[view])}
        </Button>
      ))}
    </nav>
  );
}
