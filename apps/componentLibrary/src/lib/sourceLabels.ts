/**
 * Human-readable labels for catalog namespaces (mirrored UI libraries).
 * SSOT for gallery chips, agent prompts, and any source branding copy.
 */
export const SOURCE_LABELS: Readonly<Record<string, string>> = {
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
  vybekiit: 'VybeKiit',
};

/**
 * Resolve a display label for a catalog namespace.
 *
 * @param namespace - Catalog entry namespace (e.g. `magicui`).
 * @returns Curated label, or the raw namespace when unknown.
 * @example
 * sourceLabelFor('magicui'); // "Magic UI"
 */
export const sourceLabelFor = (namespace: string): string => {
  const label = SOURCE_LABELS[namespace];
  if (label === undefined) {
    return namespace;
  }
  return label;
};
