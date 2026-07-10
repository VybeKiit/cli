import aiConversations from '../../presets/ai_conversations/preset.manifest.json' with {
  type: 'json',
};
import auditLog from '../../presets/audit_log/preset.manifest.json' with { type: 'json' };
import authBridge from '../../presets/auth-bridge/preset.manifest.json' with { type: 'json' };
import blogPosts from '../../presets/blog_posts/preset.manifest.json' with { type: 'json' };
import calendarEvents from '../../presets/calendar_events/preset.manifest.json' with {
  type: 'json',
};
import cart from '../../presets/cart/preset.manifest.json' with { type: 'json' };
import coupons from '../../presets/coupons/preset.manifest.json' with { type: 'json' };
import customers from '../../presets/customers/preset.manifest.json' with { type: 'json' };
import embeddings from '../../presets/embeddings/preset.manifest.json' with { type: 'json' };
import featureFlags from '../../presets/feature_flags/preset.manifest.json' with { type: 'json' };
import fileMetadata from '../../presets/file_metadata/preset.manifest.json' with { type: 'json' };
import jobRuns from '../../presets/job_runs/preset.manifest.json' with { type: 'json' };
import notificationsLog from '../../presets/notifications_log/preset.manifest.json' with {
  type: 'json',
};
import orders from '../../presets/orders/preset.manifest.json' with { type: 'json' };
import organizations from '../../presets/organizations/preset.manifest.json' with { type: 'json' };
import pipeline from '../../presets/pipeline/preset.manifest.json' with { type: 'json' };
import products from '../../presets/products/preset.manifest.json' with { type: 'json' };
import realtimePublications from '../../presets/realtime_publications/preset.manifest.json' with {
  type: 'json',
};
import searchDocuments from '../../presets/search_documents/preset.manifest.json' with {
  type: 'json',
};
import supportTickets from '../../presets/support_tickets/preset.manifest.json' with {
  type: 'json',
};
import tasks from '../../presets/tasks/preset.manifest.json' with { type: 'json' };
import webhookEvents from '../../presets/webhook_events/preset.manifest.json' with { type: 'json' };
import type { PresetManifest } from './types';

/** All registered DB feature presets, keyed by id. */
export const PRESET_CATALOG: Readonly<Record<string, PresetManifest>> = {
  'auth-bridge': authBridge as PresetManifest,
  orders: orders as PresetManifest,
  webhook_events: webhookEvents as PresetManifest,
  organizations: organizations as PresetManifest,
  search_documents: searchDocuments as PresetManifest,
  audit_log: auditLog as PresetManifest,
  embeddings: embeddings as PresetManifest,
  ai_conversations: aiConversations as PresetManifest,
  realtime_publications: realtimePublications as PresetManifest,
  notifications_log: notificationsLog as PresetManifest,
  feature_flags: featureFlags as PresetManifest,
  file_metadata: fileMetadata as PresetManifest,
  job_runs: jobRuns as PresetManifest,
  products: products as PresetManifest,
  cart: cart as PresetManifest,
  coupons: coupons as PresetManifest,
  customers: customers as PresetManifest,
  pipeline: pipeline as PresetManifest,
  support_tickets: supportTickets as PresetManifest,
  tasks: tasks as PresetManifest,
  blog_posts: blogPosts as PresetManifest,
  calendar_events: calendarEvents as PresetManifest,
};

/** Ordered list of all preset manifests. */
export const ALL_PRESETS: readonly PresetManifest[] = Object.values(PRESET_CATALOG);

/** Every table name owned by a preset (for native Postgres routing). */
export const PRESET_TABLE_NAMES: ReadonlySet<string> = new Set(
  ALL_PRESETS.flatMap((preset) => preset.entities.map((entity) => entity.name)),
);

/**
 * Lookup a preset by id.
 *
 * @param presetId - Preset id from the catalog or user input.
 * @returns The matching manifest, or `undefined` when the id is unknown.
 * @example
 * const preset = getPreset('orders');
 */
export const getPreset = (presetId: string): PresetManifest | undefined => PRESET_CATALOG[presetId];

/**
 * Resolve presets triggered by a buyer goal skill name.
 *
 * @param skillName - Buyer-facing skill name.
 * @returns Matching preset manifests in catalog order.
 * @example
 * const presets = presetsForSkill('take-payments');
 */
export const presetsForSkill = (skillName: string): readonly PresetManifest[] =>
  ALL_PRESETS.filter((preset) => preset.skills.includes(skillName));

/**
 * Alias for {@link presetsForSkill} kept for CLI readability.
 *
 * @param skillName - Buyer-facing skill name.
 * @returns Matching preset manifests in catalog order.
 * @example
 * const presets = listPresetsForSkill('take-payments');
 */
export const listPresetsForSkill = (skillName: string): readonly PresetManifest[] =>
  presetsForSkill(skillName);

/**
 * Resolve a required built-in preset or fail as a programmer error.
 *
 * @param presetId - Known preset id hardcoded by the kit.
 * @returns The matching preset manifest.
 * @throws When the static catalog is missing the expected preset id.
 * @example
 * const orders = requireCatalogPreset('orders');
 */
const requireCatalogPreset = (presetId: string): PresetManifest => {
  const preset = PRESET_CATALOG[presetId];
  if (preset === undefined) {
    throw new Error(`Preset catalog is missing required preset "${presetId}".`);
  }
  return preset;
};

/**
 * Resolve presets expected from configured env features.
 *
 * @param env - Process environment used by maintainer verification.
 * @returns Presets that should be present for the configured feature set.
 * @example
 * const expected = expectedPresetsFromEnv(process.env);
 */
export const expectedPresetsFromEnv = (env: NodeJS.ProcessEnv): readonly PresetManifest[] => {
  const expected = new Set<PresetManifest>();
  const hasPayments =
    Boolean(env.LEMONSQUEEZY_API_KEY) ||
    Boolean(env.STRIPE_SECRET_KEY) ||
    Boolean(env.PAYPAL_CLIENT_ID);
  if (hasPayments) {
    for (const id of ['orders', 'webhook_events'] as const) {
      expected.add(requireCatalogPreset(id));
    }
  }
  if (env.TENANCY_PROVIDER === 'better-auth' || env.DATA_PROVIDER) {
    expected.add(requireCatalogPreset('organizations'));
  }
  return [...expected];
};
