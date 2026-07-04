// Low-level Supabase data code, for callers that want raw client access.
export { createDbClient } from './client';
export { pingDatabase } from './health';
export { type DbKeySelection, selectDbKey } from './key';
export type {
  ApplyPresetResult,
  PresetManifest,
  PresetVerificationResult,
} from './presets';
export {
  ALL_PRESETS,
  applyPreset,
  applyPresets,
  expectedPresetsFromEnv,
  getPreset,
  listPresetsForSkill,
  PRESET_CATALOG,
  PRESET_TABLE_NAMES,
  postgresProviderFromEnv,
  presetsForSkill,
  renderPostgresPreset,
  renderPreset,
  verifyAllPresets,
  verifyPresets,
} from './presets';
export { createAwsDataProvider } from './providers/aws';
export { createFirebaseDataProvider } from './providers/firebase';
export { createLocalDataProvider } from './providers/local';
export { createMongoDataProvider } from './providers/mongodb';
export { createNeonDataProvider } from './providers/neon';
export { createR2StorageProvider } from './providers/r2';
export { createRailwayDataProvider, pingRailwayDatabase } from './providers/railway';
export { createS3StorageProvider } from './providers/s3';
export {
  createSupabaseDataProvider,
  createSupabaseStorageProvider,
} from './providers/supabase';
export {
  Data,
  makeDataLive,
  makeStorageLive,
  resolveDataProvider,
  resolveStorageProvider,
  Storage,
} from './resolve';
export type {
  DataProvider,
  DataProviderCapabilities,
  DataProviderName,
  DbRecord,
  QueryFilter,
  StorageProvider,
  StorageProviderName,
} from './types';
export { DbError } from './types';
