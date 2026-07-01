import type { TemplateId } from './goal-catalog';

export interface ProductionGate {
  readonly id: string;
  readonly label: string;
}

const COMMON_GATES: readonly ProductionGate[] = [
  { id: 'sign-in', label: 'Sign-in works with real accounts' },
  { id: 'quality', label: '`pnpm quality` passes' },
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

export interface ChecklistEntryInput {
  readonly from: string;
  readonly to: string;
  readonly because: string;
}

/** Gates for a template's production checklist section. */
export function planProductionChecklist(template: TemplateId): readonly ProductionGate[] {
  return TEMPLATE_GATES[template] ?? COMMON_GATES;
}

/** Render markdown checkboxes for the generated production-gates block. */
export function renderProductionGates(template: TemplateId): string {
  const gates = planProductionChecklist(template);
  const lines = ['## Before you go live', ''];
  for (const gate of gates) {
    lines.push(`- [ ] ${gate.label}`);
  }
  return lines.join('\n');
}

/** Format an append-only decision log entry for checklist.md. */
export function formatChecklistEntry(input: ChecklistEntryInput): string {
  const date = new Date().toISOString().slice(0, 10);
  return [
    `### ${date}`,
    `- **Changed:** ${input.from} → ${input.to}`,
    `- **Because:** ${input.because}`,
    '',
  ].join('\n');
}

/** Seed content for a new owned checklist.md. */
export function renderChecklistSeed(template: TemplateId): string {
  return [
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
}
