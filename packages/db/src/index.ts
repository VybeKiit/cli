export type {
  DataProvider,
  DataProviderCapabilities,
  DataProviderName,
  DbRecord,
  QueryFilter,
  StorageProvider,
  StorageProviderName,
} from './types';
export type {
  PresetManifest,
  PresetVerificationResult,
  ApplyPresetResult,
} from './presets/index';
export { resolveDataProvider, resolveStorageProvider } from './resolve';
export {
  ALL_PRESETS,
  PRESET_CATALOG,
  PRESET_TABLE_NAMES,
  applyPreset,
  applyPresets,
  expectedPresetsFromEnv,
  getPreset,
  listPresetsForSkill,
  postgresProviderFromEnv,
  presetsForSkill,
  renderPostgresPreset,
  renderPreset,
  verifyAllPresets,
  verifyPresets,
} from './presets/index';
export {
  createSupabaseDataProvider,
  createSupabaseStorageProvider,
} from './providers/supabase/index';
export { createNeonDataProvider } from './providers/neon/index';
export { createRailwayDataProvider, pingRailwayDatabase } from './providers/railway/index';
export { createFirebaseDataProvider } from './providers/firebase/index';
export { createMongoDataProvider } from './providers/mongodb/index';
export { createAwsDataProvider } from './providers/aws/index';
export { createLocalDataProvider } from './providers/local/index';
export { createS3StorageProvider } from './providers/s3/index';
export { createR2StorageProvider } from './providers/r2/index';
// Low-level Supabase data code, for callers that want raw client access.
export { createDbClient } from './client';
export { selectDbKey, type DbKeySelection } from './key';
export { pingDatabase } from './health';
