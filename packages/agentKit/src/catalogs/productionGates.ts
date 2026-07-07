import type { TemplateId } from './goalCatalog';

export type ProductionGate = {
  readonly id: string;
  readonly label: string;
};

const COMMON_GATES: readonly ProductionGate[] = [
  { id: 'sign-in', label: 'Sign-in works with real accounts' },
  { id: 'quality', label: '`pnpm verify` passes' },
  { id: 'doctor', label: 'Doctor reports all tools ready' },
  { id: 'analytics-test', label: 'Visitor stats record a test event (when analytics is enabled)' },
  { id: 'sentry-test', label: 'Error alerts received a test event (when Sentry is enabled)' },
];

const TEMPLATE_GATES: Readonly<Record<TemplateId, readonly ProductionGate[]>> = {
  web: [
    ...COMMON_GATES,
    { id: 'payments', label: 'Payments tested (practice then live)' },
    { id: 'deploy', label: 'App is live at a public URL' },
    { id: 'security', label: 'Safety check skill completed' },
  ],
  mobile: [
    ...COMMON_GATES,
    { id: 'backend', label: 'Phone app talks to live backend URL' },
    { id: 'publish', label: 'Publish path verified (store or TestFlight)' },
  ],
  extension: [
    ...COMMON_GATES,
    { id: 'backend', label: 'Extension talks to live backend URL' },
    { id: 'publish', label: 'Extension loads in Chrome Developer Mode' },
  ],
  spa: [
    ...COMMON_GATES,
    { id: 'payments', label: 'Payments tested (practice then live)' },
    { id: 'deploy', label: 'App is live at a public URL' },
    { id: 'security', label: 'Safety check skill completed' },
  ],
  backend: [
    ...COMMON_GATES,
    { id: 'health', label: '/health responds on deployed URL' },
    { id: 'cors', label: 'Mobile/extension clients can reach API with cookies' },
  ],
};

export type ChecklistEntryInput = {
  readonly from: string;
  readonly to: string;
  readonly because: string;
};

/**
 * Gates for a template's production checklist section.
 *
 * @param template - template input.
 * @returns The plan production checklist entries.
 * @example
 * const result = planProductionChecklist(template);
 */
export const planProductionChecklist = (template: TemplateId): readonly ProductionGate[] =>
  TEMPLATE_GATES[template];

/**
 * Render markdown checkboxes for the generated production-gates block.
 *
 * @param template - template input.
 * @returns The rendered render production gates text.
 * @example
 * const result = renderProductionGates(template);
 */
export const renderProductionGates = (template: TemplateId): string => {
  const gates = planProductionChecklist(template);
  const lines = ['## Before you go live', ''];
  for (const gate of gates) {
    lines.push(`- [ ] ${gate.label}`);
  }
  return lines.join('\n');
};

/**
 * Format an append-only decision log entry for checklist.md.
 *
 * @param input - input input.
 * @returns The rendered format checklist entry text.
 * @example
 * const result = formatChecklistEntry(input);
 */
export const formatChecklistEntry = (input: ChecklistEntryInput): string => {
  const date = new Date().toISOString().slice(0, 10);
  return [
    `### ${date}`,
    `- **Changed:** ${input.from} → ${input.to}`,
    `- **Because:** ${input.because}`,
    '',
  ].join('\n');
};

/**
 * Seed content for a new owned checklist.md.
 *
 * @param template - template input.
 * @returns The rendered render checklist seed text.
 * @example
 * const result = renderChecklistSeed(template);
 */
export const renderChecklistSeed = (template: TemplateId): string =>
  [
    '# Production checklist',
    '',
    'Track go-live gates and record decisions. The agent appends to the decision log after each skill.',
    '',
    '<!-- vybekiit:generated:start production-gates -->',
    renderProductionGates(template),
    '<!-- vybekiit:generated:end production-gates -->',
    '',
    '## Decision log',
    '',
    '<!-- Agent appends dated entries below — never delete -->',
    '',
  ].join('\n');
