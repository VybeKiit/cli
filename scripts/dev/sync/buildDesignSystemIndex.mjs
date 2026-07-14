#!/usr/bin/env node
/**
 * Emit the design-system index for the `@vybekiit/ui` primitives (ADR-0041).
 *
 * Derive-first: variant/size options come from each primitive's `cva` config (SSOT). The
 * per-primitive family, applicable states, extra prop docs, and which primitives need a
 * hand-authored live override live in the config below — node can't import TSX, so the ~20
 * exceptions are centralised here while the live render lives in the override module.
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const UI_SRC = 'packages/ui/src';
const STORIES_DIR = 'apps/componentLibrary/src/stories/vybekiit';
const STATES_PATH = 'apps/componentLibrary/src/lib/componentStates.json';
const OUT_DATA_PATH = 'apps/componentLibrary/src/data/designSystem.ts';
const OUT_REGISTRY_PATH = 'apps/componentLibrary/src/data/designSystemStories.tsx';

const FAMILY_ORDER = [
  'Buttons',
  'Forms',
  'Overlays',
  'Data display',
  'Feedback',
  'Layout',
  'Brand',
];

/**
 * The supported primitives, grouped by family in display order. Fan-out adds a primitive
 * here; leaf primitives auto-render from their cva axes + sample config, while behavioral or
 * compound ones set `override: true` and ship a gallery module under `stories/vybekiit/`.
 *
 * @typedef {object} PrimitiveConfig
 * @property {string} name - The `@vybekiit/ui` primitive file name (kebab-case).
 * @property {string} family - Which FAMILY_ORDER group it belongs to.
 * @property {string} title - Display title.
 * @property {string} exportName - The primary export used for auto rendering.
 * @property {import('../../../apps/componentLibrary/src/lib/componentStates').ComponentStateId[]} states
 * @property {boolean} override - True when a hand-authored gallery module is required.
 * @property {string=} sampleChildren - Text children for the auto gallery (omit for prop-only primitives).
 * @property {Record<string, string | number | boolean>=} sampleProps - Extra props for the auto gallery.
 * @property {string=} sampleClassName - Sizing className for the auto gallery swatch.
 * @property {{name:string,type:string,defaultValue?:string,description?:string}[]=} extraProps
 */
const PRIMITIVES = [
  // Buttons
  {
    name: 'button',
    family: 'Buttons',
    title: 'Button',
    exportName: 'Button',
    states: ['default', 'disabled'],
    override: false,
    sampleChildren: 'Button',
    extraProps: [{ name: 'disabled', type: 'boolean', defaultValue: 'false' }],
  },

  // Forms
  {
    name: 'input',
    family: 'Forms',
    title: 'Input',
    exportName: 'Input',
    states: ['default', 'disabled', 'error', 'readonly'],
    override: true,
    extraProps: [
      { name: 'type', type: 'string', defaultValue: "'text'" },
      { name: 'placeholder', type: 'string' },
      { name: 'disabled', type: 'boolean', defaultValue: 'false' },
      { name: 'aria-invalid', type: 'boolean', description: 'Drives the error state.' },
    ],
  },
  {
    name: 'textarea',
    family: 'Forms',
    title: 'Textarea',
    exportName: 'Textarea',
    states: ['default', 'disabled', 'readonly', 'error'],
    override: false,
    sampleProps: { placeholder: 'Write a message…' },
    sampleClassName: 'w-full max-w-sm',
    extraProps: [
      { name: 'placeholder', type: 'string' },
      { name: 'disabled', type: 'boolean', defaultValue: 'false' },
    ],
  },
  {
    name: 'label',
    family: 'Forms',
    title: 'Label',
    exportName: 'Label',
    states: ['default'],
    override: false,
    sampleChildren: 'Email address',
  },
  {
    name: 'checkbox',
    family: 'Forms',
    title: 'Checkbox',
    exportName: 'Checkbox',
    states: ['default', 'selected', 'disabled'],
    override: true,
  },
  {
    name: 'switch',
    family: 'Forms',
    title: 'Switch',
    exportName: 'Switch',
    states: ['default', 'selected', 'disabled'],
    override: true,
  },
  {
    name: 'radio-group',
    family: 'Forms',
    title: 'Radio group',
    exportName: 'RadioGroup',
    states: ['default', 'disabled'],
    override: true,
  },
  {
    name: 'select',
    family: 'Forms',
    title: 'Select',
    exportName: 'Select',
    states: ['default', 'disabled'],
    override: true,
  },

  // Overlays
  {
    name: 'dialog',
    family: 'Overlays',
    title: 'Dialog',
    exportName: 'Dialog',
    states: ['default'],
    override: true,
  },
  {
    name: 'tooltip',
    family: 'Overlays',
    title: 'Tooltip',
    exportName: 'Tooltip',
    states: ['default'],
    override: true,
  },

  // Data display
  {
    name: 'table',
    family: 'Data display',
    title: 'Table',
    exportName: 'Table',
    states: ['default', 'loading', 'empty'],
    override: true,
  },
  {
    name: 'badge',
    family: 'Data display',
    title: 'Badge',
    exportName: 'Badge',
    states: ['default'],
    override: false,
    sampleChildren: 'Badge',
  },
  {
    name: 'avatar',
    family: 'Data display',
    title: 'Avatar',
    exportName: 'Avatar',
    states: ['default'],
    override: true,
  },
  {
    name: 'card',
    family: 'Data display',
    title: 'Card',
    exportName: 'Card',
    states: ['default'],
    override: true,
  },
  {
    name: 'tabs',
    family: 'Data display',
    title: 'Tabs',
    exportName: 'Tabs',
    states: ['default'],
    override: true,
  },
  {
    name: 'accordion',
    family: 'Data display',
    title: 'Accordion',
    exportName: 'Accordion',
    states: ['default'],
    override: true,
  },
  {
    name: 'kbd',
    family: 'Data display',
    title: 'Kbd',
    exportName: 'Kbd',
    states: ['default'],
    override: false,
    sampleChildren: '⌘K',
  },
  {
    name: 'progress',
    family: 'Data display',
    title: 'Progress',
    exportName: 'Progress',
    states: ['default'],
    override: false,
    sampleProps: { value: 60 },
    sampleClassName: 'w-64',
  },

  // Feedback
  {
    name: 'alert',
    family: 'Feedback',
    title: 'Alert',
    exportName: 'Alert',
    states: ['default'],
    override: true,
  },
  {
    name: 'empty',
    family: 'Feedback',
    title: 'Empty',
    exportName: 'Empty',
    states: ['empty'],
    override: true,
  },
  {
    name: 'skeleton',
    family: 'Feedback',
    title: 'Skeleton',
    exportName: 'Skeleton',
    states: ['loading'],
    override: false,
    sampleClassName: 'h-8 w-48',
  },
  {
    name: 'spinner',
    family: 'Feedback',
    title: 'Spinner',
    exportName: 'Spinner',
    states: ['loading'],
    override: false,
  },

  // Layout
  {
    name: 'separator',
    family: 'Layout',
    title: 'Separator',
    exportName: 'Separator',
    states: ['default'],
    override: false,
    sampleClassName: 'w-64',
  },

  // Brand
  {
    name: 'shimmer-button',
    family: 'Brand',
    title: 'Shimmer button',
    exportName: 'ShimmerButton',
    states: ['default'],
    override: false,
    sampleChildren: 'Get started',
  },
  {
    name: 'glow-badge',
    family: 'Brand',
    title: 'Glow badge',
    exportName: 'GlowBadge',
    states: ['default'],
    override: false,
    sampleChildren: 'New',
  },
  {
    name: 'gradient-text',
    family: 'Brand',
    title: 'Gradient text',
    exportName: 'GradientText',
    states: ['default'],
    override: false,
    sampleChildren: 'Ship faster',
  },

  // ── Fan-out (ADR-0041 amendment): the remaining @vybekiit/ui primitives ──
  // Auto-rendered leaves (sample config; no override module).
  {
    name: 'toggle',
    family: 'Buttons',
    title: 'Toggle',
    exportName: 'Toggle',
    states: ['default', 'disabled'],
    override: false,
    sampleChildren: 'Toggle',
  },
  {
    name: 'progress-ring',
    family: 'Feedback',
    title: 'Progress ring',
    exportName: 'ProgressRing',
    states: ['default'],
    override: false,
    sampleProps: { value: 66 },
  },
  {
    name: 'animated-counter',
    family: 'Data display',
    title: 'Animated counter',
    exportName: 'AnimatedCounter',
    states: ['default'],
    override: false,
    sampleProps: { value: 1240, prefix: '$' },
    sampleClassName: 'text-2xl font-bold text-foreground',
  },
  {
    name: 'type-writer',
    family: 'Brand',
    title: 'Type writer',
    exportName: 'TypeWriter',
    states: ['default'],
    override: false,
    sampleProps: { text: 'Ship faster with VybeKiit' },
    sampleClassName: 'text-lg text-foreground',
  },
  {
    name: 'vybekiit-logo',
    family: 'Brand',
    title: 'VybeKiit mark',
    exportName: 'VybeKitMark',
    states: ['default'],
    override: false,
    sampleClassName: 'h-10 w-10 text-foreground',
  },
  {
    name: 'skeleton-pulse',
    family: 'Feedback',
    title: 'Skeleton pulse',
    exportName: 'SkeletonPulse',
    states: ['loading'],
    override: false,
    sampleProps: { width: '12rem', height: '2rem' },
  },

  // Behavioral / compound overrides — Buttons
  {
    name: 'button-group',
    family: 'Buttons',
    title: 'Button group',
    exportName: 'ButtonGroup',
    states: ['default'],
    override: true,
  },
  {
    name: 'toggle-group',
    family: 'Buttons',
    title: 'Toggle group',
    exportName: 'ToggleGroup',
    states: ['default'],
    override: true,
  },

  // Forms
  {
    name: 'field',
    family: 'Forms',
    title: 'Field',
    exportName: 'Field',
    states: ['default', 'error'],
    override: true,
  },
  {
    name: 'input-group',
    family: 'Forms',
    title: 'Input group',
    exportName: 'InputGroup',
    states: ['default'],
    override: true,
  },
  {
    name: 'segmented-control',
    family: 'Forms',
    title: 'Segmented control',
    exportName: 'SegmentedControl',
    states: ['default', 'selected'],
    override: true,
  },
  {
    name: 'calendar',
    family: 'Forms',
    title: 'Calendar',
    exportName: 'Calendar',
    states: ['default'],
    override: true,
  },
  {
    name: 'form',
    family: 'Forms',
    title: 'Form',
    exportName: 'Form',
    states: ['default', 'error'],
    override: true,
  },

  // Overlays
  {
    name: 'popover',
    family: 'Overlays',
    title: 'Popover',
    exportName: 'Popover',
    states: ['default'],
    override: true,
  },
  {
    name: 'dropdown-menu',
    family: 'Overlays',
    title: 'Dropdown menu',
    exportName: 'DropdownMenu',
    states: ['default'],
    override: true,
  },
  {
    name: 'context-menu',
    family: 'Overlays',
    title: 'Context menu',
    exportName: 'ContextMenu',
    states: ['default'],
    override: true,
  },
  {
    name: 'hover-card',
    family: 'Overlays',
    title: 'Hover card',
    exportName: 'HoverCard',
    states: ['default'],
    override: true,
  },
  {
    name: 'sheet',
    family: 'Overlays',
    title: 'Sheet',
    exportName: 'Sheet',
    states: ['default'],
    override: true,
  },
  {
    name: 'drawer',
    family: 'Overlays',
    title: 'Drawer',
    exportName: 'Drawer',
    states: ['default'],
    override: true,
  },
  {
    name: 'alert-dialog',
    family: 'Overlays',
    title: 'Alert dialog',
    exportName: 'AlertDialog',
    states: ['default'],
    override: true,
  },
  {
    name: 'command',
    family: 'Overlays',
    title: 'Command',
    exportName: 'Command',
    states: ['default'],
    override: true,
  },

  // Data display
  {
    name: 'carousel',
    family: 'Data display',
    title: 'Carousel',
    exportName: 'Carousel',
    states: ['default'],
    override: true,
  },
  {
    name: 'chart',
    family: 'Data display',
    title: 'Chart',
    exportName: 'ChartContainer',
    states: ['default'],
    override: true,
  },
  {
    name: 'kpi',
    family: 'Data display',
    title: 'KPI',
    exportName: 'Kpi',
    states: ['default'],
    override: true,
  },
  {
    name: 'icon-box',
    family: 'Data display',
    title: 'Icon box',
    exportName: 'IconBox',
    states: ['default'],
    override: true,
  },

  // Feedback
  {
    name: 'pulse-beam',
    family: 'Feedback',
    title: 'Pulse beam',
    exportName: 'PulseBeam',
    states: ['default'],
    override: true,
  },
  {
    name: 'notification-toast',
    family: 'Feedback',
    title: 'Notification toast',
    exportName: 'NotificationToast',
    states: ['default', 'success', 'error'],
    override: true,
  },
  {
    name: 'step-indicator',
    family: 'Feedback',
    title: 'Step indicator',
    exportName: 'StepIndicator',
    states: ['default'],
    override: true,
  },
  {
    name: 'sonner',
    family: 'Feedback',
    title: 'Sonner toasts',
    exportName: 'Toaster',
    states: ['default'],
    override: true,
  },

  // Layout
  {
    name: 'collapsible',
    family: 'Layout',
    title: 'Collapsible',
    exportName: 'Collapsible',
    states: ['default'],
    override: true,
  },
  {
    name: 'scroll-area',
    family: 'Layout',
    title: 'Scroll area',
    exportName: 'ScrollArea',
    states: ['default'],
    override: true,
  },
  {
    name: 'aspect-ratio',
    family: 'Layout',
    title: 'Aspect ratio',
    exportName: 'AspectRatio',
    states: ['default'],
    override: true,
  },
  {
    name: 'sidebar',
    family: 'Layout',
    title: 'Sidebar',
    exportName: 'Sidebar',
    states: ['default'],
    override: true,
  },

  // Brand
  {
    name: 'glow-card',
    family: 'Brand',
    title: 'Glow card',
    exportName: 'GlowCard',
    states: ['default'],
    override: true,
  },
  {
    name: 'AutoScrollRow',
    family: 'Brand',
    title: 'Auto scroll row',
    exportName: 'AutoScrollRow',
    states: ['default'],
    override: true,
  },
  {
    name: 'terminal-block',
    family: 'Brand',
    title: 'Terminal block',
    exportName: 'TerminalBlock',
    states: ['default'],
    override: true,
  },
  {
    name: 'agent-avatar',
    family: 'Brand',
    title: 'Agent avatar',
    exportName: 'AgentAvatar',
    states: ['default'],
    override: true,
  },
  {
    name: 'agent-logo',
    family: 'Brand',
    title: 'Agent logo',
    exportName: 'AgentLogo',
    states: ['default'],
    override: true,
  },
  {
    name: 'provider-mark',
    family: 'Brand',
    title: 'Provider mark',
    exportName: 'ProviderMark',
    states: ['default'],
    override: true,
  },
  {
    name: 'logo-grid',
    family: 'Brand',
    title: 'Logo grid',
    exportName: 'LogoGrid',
    states: ['default'],
    override: true,
  },
  {
    name: 'domain-journey-card',
    family: 'Brand',
    title: 'Domain journey card',
    exportName: 'DomainJourneyCard',
    states: ['default'],
    override: true,
  },
  {
    name: 'journey-rail',
    family: 'Brand',
    title: 'Journey rail',
    exportName: 'JourneyRail',
    states: ['default'],
    override: true,
  },
  {
    name: 'floating-panel',
    family: 'Brand',
    title: 'Floating panel',
    exportName: 'FloatingPanel',
    states: ['default'],
    override: true,
  },
];

const findMatchingBrace = (source, openIndex) => {
  let depth = 0;
  let inString = null;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (inString !== null) {
      if (ch === inString && source[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
};

const objectBlockAfter = (source, fromIndex) => {
  const open = source.indexOf('{', fromIndex);
  if (open === -1) {
    return null;
  }
  const close = findMatchingBrace(source, open);
  if (close === -1) {
    return null;
  }
  return source.slice(open + 1, close);
};

/**
 * Parse the top-level `key: value` entries of an object-literal body.
 *
 * @param {string} inner - The text between an object's braces.
 * @returns {{ key: string, valueInner: string | null, value: string | null }[]} Entries.
 * @example
 * topLevelEntries("a: { x: 1 }, b: 'z'");
 */
const topLevelEntries = (inner) => {
  const entries = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) {
      i += 1;
    }
    if (i >= inner.length) {
      break;
    }
    let key = '';
    if (inner[i] === "'" || inner[i] === '"') {
      const quote = inner[i];
      i += 1;
      while (i < inner.length && inner[i] !== quote) {
        key += inner[i];
        i += 1;
      }
      i += 1;
    } else {
      while (i < inner.length && /[\w$-]/.test(inner[i])) {
        key += inner[i];
        i += 1;
      }
    }
    while (i < inner.length && inner[i] !== ':') {
      i += 1;
    }
    i += 1;
    while (i < inner.length && /\s/.test(inner[i])) {
      i += 1;
    }
    if (inner[i] === '{') {
      const close = findMatchingBrace(inner, i);
      entries.push({ key, valueInner: inner.slice(i + 1, close), value: null });
      i = close + 1;
    } else {
      let value = '';
      let depth = 0;
      let inString = null;
      while (i < inner.length) {
        const ch = inner[i];
        if (inString !== null) {
          value += ch;
          if (ch === inString && inner[i - 1] !== '\\') {
            inString = null;
          }
          i += 1;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          inString = ch;
          value += ch;
          i += 1;
          continue;
        }
        if (ch === '{' || ch === '[' || ch === '(') {
          depth += 1;
        } else if (ch === '}' || ch === ']' || ch === ')') {
          depth -= 1;
        }
        if (ch === ',' && depth === 0) {
          break;
        }
        value += ch;
        i += 1;
      }
      entries.push({ key, valueInner: null, value: value.trim() });
    }
  }
  return entries;
};

/**
 * Strip `//` and block comments while respecting strings, so interleaved JSDoc between cva
 * entries (e.g. `alert`'s `/** … *\/`) can't be misread as an object key.
 *
 * @param {string} source - Raw source text.
 * @returns {string} Source with comments blanked out.
 * @example
 * stripComments("a: 1, /* x *\/ b: 2"); // "a: 1,   b: 2"
 */
const stripComments = (source) => {
  let out = '';
  let inString = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inString !== null) {
      out += ch;
      if (ch === inString && source[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      out += ch;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') {
        i += 1;
      }
      out += '\n';
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i + 1 < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        i += 1;
      }
      i += 1;
      out += ' ';
      continue;
    }
    out += ch;
  }
  return out;
};

/**
 * Extract the cva variant axes (name, options, default) from a primitive source file.
 *
 * @param {string} rawSource - The primitive's `.tsx` source.
 * @returns {{ name: string, options: string[], defaultOption?: string }[]} The cva axes.
 * @example
 * parseCvaAxes(buttonSource); // [{ name: 'variant', options: [...] }, { name: 'size', ... }]
 */
export const parseCvaAxes = (rawSource) => {
  const source = stripComments(rawSource);
  const cvaIndex = source.indexOf('cva(');
  if (cvaIndex === -1) {
    return [];
  }
  const variantsIndex = source.indexOf('variants:', cvaIndex);
  if (variantsIndex === -1) {
    return [];
  }
  const variantsInner = objectBlockAfter(source, variantsIndex);
  if (variantsInner === null) {
    return [];
  }
  const defaults = {};
  const defaultsIndex = source.indexOf('defaultVariants:', cvaIndex);
  if (defaultsIndex !== -1) {
    const defaultsInner = objectBlockAfter(source, defaultsIndex);
    if (defaultsInner !== null) {
      for (const entry of topLevelEntries(defaultsInner)) {
        if (entry.value !== null) {
          defaults[entry.key] = entry.value.replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
  return topLevelEntries(variantsInner)
    .filter((axis) => axis.valueInner !== null)
    .map((axis) => {
      const options = topLevelEntries(axis.valueInner).map((option) => option.key);
      const axisEntry = { name: axis.key, options };
      if (defaults[axis.key] !== undefined) {
        axisEntry.defaultOption = defaults[axis.key];
      }
      return axisEntry;
    });
};

const propsFromAxes = (axes, extraProps) => {
  const axisProps = axes.map((axis) => {
    const prop = {
      name: axis.name,
      type: axis.options.map((option) => `'${option}'`).join(' | '),
    };
    if (axis.defaultOption !== undefined) {
      prop.defaultValue = `'${axis.defaultOption}'`;
    }
    return prop;
  });
  return [...axisProps, ...(extraProps ?? [])];
};

/**
 * Build the validated design-system index from the primitive config + cva sources.
 *
 * @param {{ repoRoot?: string }} options - Build options.
 * @returns {Promise<{ primitives: object[], families: object[] }>} The index.
 * @example
 * const index = await buildDesignSystemModel();
 */
export const buildDesignSystemModel = async ({ repoRoot = REPO_ROOT } = {}) => {
  const rawStates = JSON.parse(await readFile(join(repoRoot, STATES_PATH), 'utf8'));
  const stateIds = new Set(rawStates.map((state) => state.id));

  const primitives = [];
  for (const config of PRIMITIVES) {
    const sourcePath = join(repoRoot, UI_SRC, `${config.name}.tsx`);
    await access(sourcePath);
    const source = await readFile(sourcePath, 'utf8');
    if (!source.includes(config.exportName)) {
      throw new Error(`Primitive ${config.name} must export ${config.exportName}`);
    }

    for (const state of config.states) {
      if (!stateIds.has(state)) {
        throw new Error(`Primitive ${config.name} declares unknown state: ${state}`);
      }
    }

    if (config.override) {
      const overridePath = join(repoRoot, STORIES_DIR, `${config.name}.tsx`);
      try {
        await access(overridePath);
      } catch {
        throw new Error(
          `Primitive ${config.name} is behavioral (override: true) but ${STORIES_DIR}/${config.name}.tsx is missing`,
        );
      }
    }

    const axes = parseCvaAxes(source);
    primitives.push({
      name: config.name,
      title: config.title,
      family: config.family,
      slug: config.name,
      importPath: `@vybekiit/ui/${config.name}`,
      exportName: config.exportName,
      axes,
      states: config.states,
      props: propsFromAxes(axes, config.extraProps),
      hasOverride: config.override,
      sampleChildren: config.sampleChildren ?? '',
      sampleProps: config.sampleProps ?? {},
      sampleClassName: config.sampleClassName ?? '',
    });
  }

  const families = FAMILY_ORDER.map((name, order) => ({
    name,
    order,
    primitives: primitives.filter((primitive) => primitive.family === name).map((p) => p.name),
  })).filter((family) => family.primitives.length > 0);

  return { primitives, families };
};

const buildGeneratedDataSource = (index) =>
  `/** Generated by scripts/dev/sync/buildDesignSystemIndex.mjs - do not edit. */
// biome-ignore-all format: generated design-system data stays byte-stable for check mode.
import type { ComponentStateId } from '@library/lib/componentStates';

export interface PrimitiveVariantAxis {
  readonly name: string;
  readonly options: readonly string[];
  readonly defaultOption?: string;
}

export interface PrimitivePropDoc {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description?: string;
}

export interface PrimitiveDescriptor {
  readonly name: string;
  readonly title: string;
  readonly family: string;
  readonly slug: string;
  readonly importPath: string;
  readonly exportName: string;
  readonly axes: readonly PrimitiveVariantAxis[];
  readonly states: readonly ComponentStateId[];
  readonly props: readonly PrimitivePropDoc[];
  readonly hasOverride: boolean;
  readonly sampleChildren: string;
  readonly sampleProps: Readonly<Record<string, string | number | boolean>>;
  readonly sampleClassName: string;
}

export interface PrimitiveFamily {
  readonly name: string;
  readonly order: number;
  readonly primitives: readonly string[];
}

export const DESIGN_SYSTEM_PRIMITIVES = ${JSON.stringify(index.primitives, null, 2)} as const satisfies readonly PrimitiveDescriptor[];

export const DESIGN_SYSTEM_FAMILIES = ${JSON.stringify(index.families, null, 2)} as const satisfies readonly PrimitiveFamily[];

export const PRIMITIVE_BY_SLUG = Object.fromEntries(
  DESIGN_SYSTEM_PRIMITIVES.map((primitive) => [primitive.slug, primitive]),
) as Record<string, PrimitiveDescriptor>;
`;

const buildGeneratedRegistrySource = (index) => {
  const autos = index.primitives.filter((primitive) => !primitive.hasOverride);
  const overrides = index.primitives.filter((primitive) => primitive.hasOverride);
  const autoImports = autos
    .map((primitive) => `import { ${primitive.exportName} } from '${primitive.importPath}';`)
    .join('\n');
  const autoEntries = autos
    .map(
      (primitive) =>
        `  '${primitive.name}': ${primitive.exportName} as unknown as ComponentType<Record<string, unknown>>,`,
    )
    .join('\n');
  // Overrides default-export a `{ ShowAll }` module object; map it to a component for `dynamic()`.
  // Lazy per-primitive so each /design-system/[slug] compiles only its own chunk — the heavy libs
  // (recharts/embla/cmdk/vaul/day-picker) no longer land in every design-system route.
  const overrideEntries = overrides
    .map(
      (primitive) =>
        `  '${primitive.name}': dynamic(() => import('@library/stories/vybekiit/${primitive.name}').then((m) => ({ default: m.default.ShowAll })), { ssr: false, loading: OverrideFallback }),`,
    )
    .join('\n');

  return `/** Generated by scripts/dev/sync/buildDesignSystemIndex.mjs - do not edit. */
// biome-ignore-all format: generated registry stays byte-stable for check mode.
// biome-ignore-all assist/source/organizeImports: generated registry preserves display order.
'use client';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
${autoImports}

/** Shown while a lazily-loaded override gallery chunk resolves. */
const OverrideFallback = () => null;

/** Raw primitives rendered by the auto playground (no override needed). */
export const PRIMITIVE_AUTO_COMPONENTS: Readonly<Record<string, ComponentType<Record<string, unknown>>>> = {
${autoEntries}
};

/** Hand-authored live galleries, lazy per-primitive so a slug only compiles its own chunk. */
export const PRIMITIVE_OVERRIDE_COMPONENTS: Readonly<Record<string, ComponentType>> = {
${overrideEntries}
};
`;
};

/**
 * Validate and optionally write the generated design-system modules.
 *
 * @param {{ repoRoot?: string, check?: boolean }} options - Build options.
 * @returns {Promise<void>} Resolves when the index is current.
 * @example
 * await buildDesignSystemIndex({ check: true });
 */
export const buildDesignSystemIndex = async ({ repoRoot = REPO_ROOT, check = false } = {}) => {
  const index = await buildDesignSystemModel({ repoRoot });
  const dataSource = buildGeneratedDataSource(index);
  const registrySource = buildGeneratedRegistrySource(index);
  const dataPath = join(repoRoot, OUT_DATA_PATH);
  const registryPath = join(repoRoot, OUT_REGISTRY_PATH);

  if (check) {
    const existingData = await readFile(dataPath, 'utf8');
    if (existingData !== dataSource) {
      throw new Error(
        'Design-system index is out of date. Run node scripts/dev/sync/buildDesignSystemIndex.mjs',
      );
    }
    const existingRegistry = await readFile(registryPath, 'utf8');
    if (existingRegistry !== registrySource) {
      throw new Error(
        'Design-system story registry is out of date. Run node scripts/dev/sync/buildDesignSystemIndex.mjs',
      );
    }
    return;
  }

  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, dataSource, 'utf8');
  await writeFile(registryPath, registrySource, 'utf8');
  console.log(`Wrote ${OUT_DATA_PATH} and ${OUT_REGISTRY_PATH} (${index.primitives.length} primitives)`);
};

/**
 * CLI entrypoint for the design-system index builder.
 *
 * @returns {Promise<void>} Resolves when the command completes.
 * @example
 * await main();
 */
export const main = async () => {
  await buildDesignSystemIndex({ check: process.argv.includes('--check') });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
