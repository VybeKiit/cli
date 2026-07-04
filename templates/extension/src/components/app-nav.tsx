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
  marketing = false,
}: {
  active: ExtensionView;
  onChange: (view: ExtensionView) => void;
  compact?: boolean;
  marketing?: boolean;
}) {
  return (
    <nav
      className={cn(
        'flex gap-1 border-t p-2',
        marketing ? 'border-white/10 bg-[#03070d]' : 'border-border bg-background',
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
