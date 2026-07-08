import type { TemplateName } from '../lib/scaffold';

export type DropFlags = {
  readonly force: boolean;
  readonly merge: boolean;
  readonly dryRun: boolean;
  readonly json: boolean;
};

export type ParsedDropArgs = {
  readonly flags: DropFlags;
  readonly template?: TemplateName;
  readonly destPath?: string;
};

export type ResolvedDropInputs = {
  readonly flags: DropFlags;
  readonly template: TemplateName;
  readonly destPath: string;
};

export type DropTemplateSource = {
  readonly source: string;
  readonly cleanup?: () => Promise<void>;
};

export type DropDestinationState = {
  readonly exists: boolean;
  readonly hasFiles: boolean;
};

export type DropContext = ResolvedDropInputs & {
  readonly dest: string;
  readonly templateDir: string;
};

export type DropMode = 'force' | 'merge' | 'new';

export const DROP_MODE_LABELS: Record<DropMode, string> = {
  force: 'force (overwrite)',
  merge: 'merge (skip existing)',
  new: 'new',
};

type DropTemplateOption = {
  value: TemplateName;
  label: string;
  hint: string;
};

export const DROP_TEMPLATE_OPTIONS: DropTemplateOption[] = [
  {
    value: 'web',
    label: '🌐 Web (Next.js)',
    hint: 'Full-stack: marketing + dashboard + API',
  },
  {
    value: 'spa',
    label: '📊 Admin SPA (Vite + React)',
    hint: 'Dashboard that pairs with backend',
  },
  { value: 'mobile', label: '📱 Mobile (Expo)', hint: 'iOS + Android + Web' },
  { value: 'extension', label: '🧩 Browser Extension (WXT)', hint: 'Chrome/Firefox/Safari' },
  {
    value: 'backend',
    label: '⚡ Backend API (Express)',
    hint: 'REST API for mobile/SPA/extension',
  },
];

/**
 * Resolve the drop mode from mutually-exclusive flags.
 *
 * @param flags - Parsed `drop` flags.
 * @returns The effective copy mode.
 * @example
 * const mode = dropMode({ force: false, merge: true, dryRun: false, json: false });
 */
export const dropMode = (flags: DropFlags): DropMode => {
  if (flags.force) {
    return 'force';
  }
  if (flags.merge) {
    return 'merge';
  }
  return 'new';
};
