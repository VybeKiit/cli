import type { CatalogEntry } from '@library/data/catalog';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';

const SOURCE_LABELS: Record<string, string> = {
  bundui: 'BundUI',
  magicui: 'Magic UI',
  kokonutui: 'Kokonut UI',
  aceternity: 'Aceternity UI',
  untitled: 'Untitled UI',
  gluestack: 'Gluestack UI',
  'ai-elements': 'AI Elements',
  kibo: 'Kibo UI',
  'blocks-21st': '21st.dev',
  tailark: 'Tailark',
  cult: 'Cult UI',
  coss: 'COSS UI',
  'prompt-kit': 'Prompt Kit',
  supabase: 'Supabase UI',
  'blocks-so': 'Blocks.so',
  evilcharts: 'EvilCharts',
  shadcnblocks: 'Shadcnblocks',
};

function catalogBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://ui.vybekiit.com';
}

export function componentPreviewUrl(entry: CatalogEntry): string {
  return `${catalogBaseUrl()}/components/${entry.namespace}/${encodeURIComponent(entry.name)}`;
}

function sourceLabel(namespace: string): string {
  return SOURCE_LABELS[namespace] ?? namespace;
}

/** Agent-ready prompt for a single mirrored component. */
export function buildComponentAgentPrompt(entry: CatalogEntry): string {
  const preview = componentPreviewUrl(entry);
  const library = sourceLabel(entry.namespace);

  return [
    'Implement this VybeKiit UI component in my app.',
    '',
    `Component: **${entry.name}**`,
    `Library: ${library} (\`${entry.namespace}\`)`,
    `Import path: \`${entry.importPath}\``,
    `Category: ${categoryLabelFromSlug(entry.category)}`,
    `Kind: ${entry.kind}`,
    `Live preview: ${preview}`,
    '',
    'The source is already mirrored in the VybeKiit web template under `src/components/`.',
    'Normalize to kit primitives and `@vybekiit/tokens` per `.vybekiit/agent/ui-consistency-vybekiit.md`.',
    'Pick from `.vybekiit/agent/ui-sources.md` rules — do not swap libraries.',
    '',
    'Wire this component into the screen or flow I describe next.',
  ].join('\n');
}

/** Agent-ready prompt for multiple selected components. */
export function buildBulkAgentPrompt(entries: CatalogEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  if (entries.length === 1) {
    return buildComponentAgentPrompt(entries[0]!);
  }

  const lines = [
    `Implement the following ${entries.length} VybeKiit UI components in my app.`,
    '',
    'Each block is already mirrored in the web template. Normalize every import to kit primitives per `.vybekiit/agent/ui-consistency-vybekiit.md`.',
    '',
  ];

  entries.forEach((entry, index) => {
    lines.push(
      `${index + 1}. **${entry.name}** (${sourceLabel(entry.namespace)})`,
      `   - Import: \`${entry.importPath}\``,
      `   - Category: ${categoryLabelFromSlug(entry.category)}`,
      `   - Preview: ${componentPreviewUrl(entry)}`,
      '',
    );
  });

  lines.push('Compose them together on the page or flow I describe next.');

  return lines.join('\n');
}
