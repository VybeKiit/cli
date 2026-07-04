import aiConversations from '../../presets/ai_conversations/preset.manifest.json' with {
  type: 'json',
};
import auditLog from '../../presets/audit_log/preset.manifest.json' with { type: 'json' };
import authBridge from '../../presets/auth-bridge/preset.manifest.json' with { type: 'json' };
import embeddings from '../../presets/embeddings/preset.manifest.json' with { type: 'json' };
import featureFlags from '../../presets/feature_flags/preset.manifest.json' with { type: 'json' };
import fileMetadata from '../../presets/file_metadata/preset.manifest.json' with { type: 'json' };
import jobRuns from '../../presets/job_runs/preset.manifest.json' with { type: 'json' };
import notificationsLog from '../../presets/notifications_log/preset.manifest.json' with {
  type: 'json',
};
import orders from '../../presets/orders/preset.manifest.json' with { type: 'json' };
import organizations from '../../presets/organizations/preset.manifest.json' with { type: 'json' };
import realtimePublications from '../../presets/realtime_publications/preset.manifest.json' with {
  type: 'json',
};
import searchDocuments from '../../presets/search_documents/preset.manifest.json' with {
  type: 'json',
};
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
};

/** Ordered list of all preset manifests. */
export const ALL_PRESETS: readonly PresetManifest[] = Object.values(PRESET_CATALOG);

/** Every table name owned by a preset (for native Postgres routing). */
export const PRESET_TABLE_NAMES: ReadonlySet<string> = new Set(
  ALL_PRESETS.flatMap((preset) => preset.entities.map((entity) => entity.name)),
);

/** Lookup a preset by id; returns undefined when unknown. */
export function getPreset(presetId: string): PresetManifest | undefined {
  return PRESET_CATALOG[presetId];
}

/** Presets triggered by a buyer goal skill name. */
export function presetsForSkill(skillName: string): readonly PresetManifest[] {
  return ALL_PRESETS.filter((preset) => preset.skills.includes(skillName));
}

/** Presets expected when payment env is configured. */
export function expectedPresetsFromEnv(env: NodeJS.ProcessEnv): readonly PresetManifest[] {
  const expected = new Set<PresetManifest>();
  const hasPayments =
    Boolean(env.LEMONSQUEEZY_API_KEY) ||
    Boolean(env.STRIPE_SECRET_KEY) ||
    Boolean(env.PAYPAL_CLIENT_ID);
  if (hasPayments) {
    for (const id of ['orders', 'webhook_events'] as const) {
      const preset = PRESET_CATALOG[id];
      if (preset) expected.add(preset);
    }
  }
  if (env.TENANCY_PROVIDER === 'better-auth' || env.DATA_PROVIDER) {
    const org = PRESET_CATALOG.organizations;
    if (org) expected.add(org);
  }
  return [...expected];
}
