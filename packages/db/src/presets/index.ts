import { presetsForSkill as presetsForSkillFn } from './catalog';

export type {
  DataCapability,
  PostgresProviderName,
  PresetColumn,
  PresetEntity,
  PresetIndex,
  PresetManifest,
  PresetProviderStatus,
  PresetRlsMode,
  PresetVerificationIssue,
  PresetVerificationResult,
  RenderedPreset,
} from './types';

export {
  ALL_PRESETS,
  PRESET_CATALOG,
  PRESET_TABLE_NAMES,
  expectedPresetsFromEnv,
  getPreset,
  presetsForSkill,
} from './catalog';

export { renderPreset, renderPostgresPreset } from './render';

export {
  applyPreset,
  applyPresets,
  renderPresetSql,
  resolvePostgresProvider,
  type ApplyPresetOptions,
  type ApplyPresetResult,
} from './apply';

export { verifyAllPresets, verifyPresets, postgresProviderFromEnv } from './verify';

export { PRESET_HELPERS, REALTIME_TABLES } from './helpers';

/** Alias for {@link presetsForSkill}. */
export function listPresetsForSkill(skillName: string) {
  return presetsForSkillFn(skillName);
}
