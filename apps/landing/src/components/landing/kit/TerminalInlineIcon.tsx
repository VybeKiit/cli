import { CodexMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { cn } from '@/lib/utils';

interface TerminalInlineIconProps {
  readonly slug: string;
  readonly className?: string;
}

/**
 * Tiny brand mark embedded inside a terminal prompt line.
 *
 * @param props - Component props.
 * @returns The rendered TerminalInlineIcon element.
 * @example
 * ```tsx
 * <TerminalInlineIcon />
 * ```
 */

export const TerminalInlineIcon = ({ slug, className }: TerminalInlineIconProps) => {
  if (slug === 'codex') {
    return (
      <CodexMark className={cn('terminal-inline-icon terminal-inline-icon--codex', className)} />
    );
  }

  return <LogoMarkIcon className={cn('terminal-inline-icon', className)} mono={true} slug={slug} />;
};
