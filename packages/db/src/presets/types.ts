/** Column types supported in preset manifests (Postgres-native). */
export type PresetColumnType =
  | 'text'
  | 'uuid'
  | 'boolean'
  | 'timestamptz'
  | 'jsonb'
  | 'numeric'
  | 'vector';

export type PresetRlsMode =
  | 'service-role-only'
  | 'user-owned'
  | 'org-owned'
  | 'public-read-authenticated-write'
  | 'none';

export type DataCapability =
  | 'upsert'
  | 'idempotentInsert'
  | 'vectorSearch'
  | 'fullTextSearch'
  | 'bulkInsert'
  | 'transaction';

export type PostgresProviderName = 'supabase' | 'neon' | 'railway';

export type NosqlProviderName = 'mongodb' | 'firebase' | 'aws';

export type PresetProviderStatus = 'stable' | 'planned';

export type PresetColumn = {
  readonly name: string;
  readonly type: PresetColumnType;
  readonly required?: boolean;
  readonly unique?: boolean;
  readonly default?: string;
  readonly references?: { readonly table: string; readonly column: string };
  readonly generated?: string;
};

export type PresetEntity = {
  readonly name: string;
  readonly columns: readonly PresetColumn[];
  readonly primaryKey?: string;
};

export type PresetRelation = {
  readonly from: string;
  readonly to: string;
  readonly foreignKey: string;
  readonly type: 'one' | 'many';
};

export type PresetIndex = {
  readonly table: string;
  readonly columns: readonly string[];
  readonly unique?: boolean;
  readonly method?: 'btree' | 'gin' | 'hnsw' | 'ivfflat';
  readonly where?: string;
  readonly reason: string;
};

export type PresetManifest = {
  readonly id: string;
  readonly version: number;
  readonly description?: string;
  readonly entities: readonly PresetEntity[];
  readonly relations?: readonly PresetRelation[];
  readonly indexes: readonly PresetIndex[];
  readonly extensions?: readonly string[];
  readonly rls: PresetRlsMode;
  readonly rlsColumn?: string;
  readonly orgColumn?: string;
  readonly capabilities: readonly DataCapability[];
  readonly skills: readonly string[];
  readonly packages: readonly string[];
  readonly providers?: Partial<
    Record<PostgresProviderName | NosqlProviderName, PresetProviderStatus>
  >;
  readonly helpers?: readonly string[];
};

export type RenderedPreset = {
  readonly presetId: string;
  readonly provider: PostgresProviderName | NosqlProviderName;
  readonly sql?: string;
  readonly nosqlNotes?: string;
};

export type PresetVerificationIssue = {
  readonly presetId: string;
  readonly table: string;
  readonly issue: 'missing_table' | 'missing_index' | 'rls_gap';
  readonly detail: string;
};

export type PresetVerificationResult = {
  readonly ok: boolean;
  readonly issues: readonly PresetVerificationIssue[];
  readonly applied: readonly string[];
};
