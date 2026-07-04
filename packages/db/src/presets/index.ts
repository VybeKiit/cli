import { presetsForSkill as presetsForSkillFn } from './catalog';

export {
  type ApplyPresetOptions,
  type ApplyPresetResult,
  applyPreset,
  applyPresets,
  renderPresetSql,
  resolvePostgresProvider,
} from './apply';

export {
  ALL_PRESETS,
  expectedPresetsFromEnv,
  getPreset,
  PRESET_CATALOG,
  PRESET_TABLE_NAMES,
  presetsForSkill,
} from './catalog';
export { PRESET_HELPERS, REALTIME_TABLES } from './helpers';
export { renderPostgresPreset, renderPreset } from './render';
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
export { postgresProviderFromEnv, verifyAllPresets, verifyPresets } from './verify';

/** Alias for {@link presetsForSkill}. */
export function listPresetsForSkill(skillName: string) {
  return presetsForSkillFn(skillName);
}
