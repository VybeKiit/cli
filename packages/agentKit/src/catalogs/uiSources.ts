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
  /** Local mirror namespace under src/components/ (web template). */
  readonly namespace?: string;
  /** Upstream GitHub source when available. */
  readonly github?: string;
  /** shadcn registry prefix, hosted URL template, or CLI id. */
  readonly registry?: string;
}

/** Namespaced UI mirror targets in templates/web/src/components/. */
export const UI_MIRROR_NAMESPACES = {
  kit: 'ui',
  bundui: 'bundui',
  magicui: 'magicui',
  kokonutui: 'kokonutui',
  aceternity: 'aceternity',
  untitled: 'untitled',
  gluestack: 'gluestack',
  blocks21st: 'blocks/21st',
} as const;

/** shadcn-compatible registries the web/extension agent may choose from. */
export const WEB_UI_SOURCES: readonly UiSourceEntry[] = [
  {
    name: 'shadcn/ui',
    url: 'https://ui.shadcn.com',
    bestFor: 'Core primitives, forms, dialogs',
    install: 'npx shadcn@latest add <component>',
    notes: 'Default foundation — always prefer over duplicates',
    namespace: UI_MIRROR_NAMESPACES.kit,
    github: 'https://github.com/shadcn-ui/ui',
    registry: 'shadcn',
  },
  {
    name: 'BundUI / Shadcn UI Kit',
    url: 'https://shadcnuikit.com/components',
    bestFor: '503+ free shadcn variants, blocks, admin patterns',
    install: 'npx shadcn@latest add @bundui/<name>',
    notes: 'Mirror in components/bundui/; normalize controls to kit primitives',
    namespace: UI_MIRROR_NAMESPACES.bundui,
    github: 'https://github.com/bundui/components',
    registry: '@bundui',
  },
  {
    name: 'Magic UI',
    url: 'https://magicui.design',
    bestFor: 'Animated marketing, marquees, beams, bento',
    install: 'npx shadcn@latest add @magicui/<name>',
    notes: 'Mirror in components/magicui/; normalize buttons/inputs to kit primitives',
    namespace: UI_MIRROR_NAMESPACES.magicui,
    github: 'https://github.com/magicuidesign/magicui',
    registry: '@magicui',
  },
  {
    name: 'Kokonut UI',
    url: 'https://kokonutui.com',
    bestFor: 'Interactive marketing, modern layouts',
    install: 'npx shadcn@latest add @kokonutui/<name>',
    notes: 'Mirror in components/kokonutui/; shadcn + Motion; strip custom button sizes',
    namespace: UI_MIRROR_NAMESPACES.kokonutui,
    github: 'https://github.com/kokonut-labs/kokonutui',
    registry: '@kokonutui',
  },
  {
    name: '21st.dev',
    url: 'https://21st.dev',
    bestFor: 'Community blocks, agent templates',
    install: 'npx shadcn add <registry-url>',
    notes: 'Mirror curated blocks in components/blocks/21st/; reject blocks that bypass primitives',
    namespace: UI_MIRROR_NAMESPACES.blocks21st,
    github: 'https://github.com/serafimcloud/21st',
    registry: 'https://21st.dev/r/{user}/{slug}',
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
    install: 'npx shadcn@latest add https://ui.aceternity.com/registry/<name>.json',
    notes: 'Mirror in components/aceternity/; free tier only; no OSS GitHub',
    namespace: UI_MIRROR_NAMESPACES.aceternity,
    registry: 'https://ui.aceternity.com/registry/{name}.json',
  },
  {
    name: 'Untitled UI React',
    url: 'https://www.untitledui.com/react',
    bestFor: 'Enterprise admin, dense application UI',
    install: 'npx untitledui@latest add <name>',
    notes: 'Mirror in components/untitled/; React Aria — never merge into ui/',
    namespace: UI_MIRROR_NAMESPACES.untitled,
    github: 'https://github.com/untitleduico/react',
    registry: 'untitledui',
  },
  {
    name: 'Gluestack UI',
    url: 'https://gluestack.io/ui',
    bestFor: 'Cross-platform patterns (web mirror only in VybeKiit)',
    install: 'npx gluestack-ui@latest add <name>',
    notes: 'Mirror web subset in components/gluestack/; mobile ports via kit StyleSheet only',
    namespace: UI_MIRROR_NAMESPACES.gluestack,
    github: 'https://github.com/gluestack/gluestack-ui',
    registry: 'gluestack-ui',
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
