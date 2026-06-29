/**
 * Approved UI block sources — agent-only catalog synced into template agent docs.
 * Web/extension: shadcn-compatible registries. Mobile: port-only rules.
 */

export interface UiSourceEntry {
  readonly name: string;
  readonly url: string;
  readonly bestFor: string;
  readonly install: string;
  readonly notes: string;
}

/** shadcn-compatible registries the web/extension agent may choose from. */
export const WEB_UI_SOURCES: readonly UiSourceEntry[] = [
  {
    name: 'shadcn/ui',
    url: 'https://ui.shadcn.com',
    bestFor: 'Core primitives, forms, dialogs',
    install: 'npx shadcn@latest add <component>',
    notes: 'Default foundation — always prefer over duplicates',
  },
  {
    name: 'Magic UI',
    url: 'https://magicui.design',
    bestFor: 'Animated marketing, marquees, beams, bento',
    install: 'npx shadcn@latest add @magicui/<name>',
    notes: 'Normalize buttons/inputs to kit primitives',
  },
  {
    name: 'Kokonut UI',
    url: 'https://kokonutui.com',
    bestFor: 'Interactive marketing, modern layouts',
    install: 'npx shadcn@latest add @kokonutui/<name>',
    notes: 'shadcn + Motion; strip custom button sizes',
  },
  {
    name: '21st.dev',
    url: 'https://21st.dev',
    bestFor: 'Community blocks, agent templates',
    install: 'npx shadcn add <registry-url>',
    notes: 'Curate quality; reject blocks that bypass primitives',
  },
  {
    name: 'Origin UI',
    url: 'https://originui.com',
    bestFor: 'Extra shadcn-style primitives',
    install: 'Registry CLI',
    notes: 'Merge into src/components/ui/ once',
  },
  {
    name: 'Aceternity UI',
    url: 'https://ui.aceternity.com',
    bestFor: 'High-motion landing sections',
    install: 'Copy-paste',
    notes: 'Marketing only; normalize spacing',
  },
  {
    name: 'Cult UI',
    url: 'https://cult-ui.com',
    bestFor: 'AI chat / agent UI patterns',
    install: 'Copy-paste / registry',
    notes: 'Map to kit forms',
  },
  {
    name: 'Tailark',
    url: 'https://tailark.com',
    bestFor: 'Marketing blocks, conversion layouts',
    install: 'Copy-paste / registry',
    notes: 'Keep token colors',
  },
  {
    name: 'Tremor',
    url: 'https://tremor.so',
    bestFor: 'Dashboards, KPI cards, charts',
    install: 'npm @tremor/react or blocks',
    notes: 'Dashboard-only; wrap in kit Card',
  },
  {
    name: 'shadcn/ui Charts',
    url: 'https://ui.shadcn.com/charts',
    bestFor: 'Charts (Recharts)',
    install: 'npx shadcn@latest add chart',
    notes: 'Preferred over random chart libs',
  },
  {
    name: 'shadcn.io blocks',
    url: 'https://shadcn.io/blocks',
    bestFor: 'Large block marketplace',
    install: 'Registry browse',
    notes: 'Normalize before merge',
  },
  {
    name: 'Shadcnblocks',
    url: 'https://shadcnblocks.com',
    bestFor: 'Figma-aligned blocks',
    install: 'Registry / copy',
    notes: 'Free blocks OK; paid agent-only',
  },
  {
    name: 'ReUI / Skiper UI / MynaUI',
    url: 'https://reui.io',
    bestFor: 'Additional shadcn-style sets',
    install: 'Registry',
    notes: 'Secondary when official shadcn lacks a pattern',
  },
];

export const FORBIDDEN_WEB_UI_LIBS: readonly string[] = [
  '@mui/',
  '@chakra-ui/',
  'antd',
  'react-native-paper',
  'nativewind',
  'daisyui',
  '@heroui/',
];

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/** Render {@link WEB_UI_SOURCES} as a markdown table for agent ui-sources docs. */
export function renderWebUiSourcesTable(): string {
  const header = '| Source | Best for | Install | Notes |';
  const divider = '|---|---|---|---|';
  const rows = WEB_UI_SOURCES.map(
    (entry) =>
      `| [${escapeCell(entry.name)}](${entry.url}) | ${escapeCell(entry.bestFor)} | ${escapeCell(entry.install)} | ${escapeCell(entry.notes)} |`,
  );
  return [header, divider, ...rows].join('\n');
}

/** Bullet list of forbidden UI libraries for grep checks. */
export function renderForbiddenWebUiLibsList(): string {
  return FORBIDDEN_WEB_UI_LIBS.map((lib) => `- \`${lib}\``).join('\n');
}
