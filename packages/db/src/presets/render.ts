import { PRESET_HELPERS, REALTIME_TABLES, renderRealtimeGrants } from './helpers';
import type {
  NosqlProviderName,
  PostgresProviderName,
  PresetColumn,
  PresetColumnType,
  PresetEntity,
  PresetIndex,
  PresetManifest,
  PresetRlsMode,
  RenderedPreset,
} from './types';

/** MongoDB index keys map field → sort direction. */
export type MongoIndexKeys = Readonly<Record<string, 1 | -1>>;

/** Executable MongoDB createIndex specification derived from a preset index. */
export type MongoIndexSpec = {
  readonly name: string;
  readonly keys: MongoIndexKeys;
  readonly unique?: boolean;
  readonly partialFilterExpression?: Readonly<Record<string, unknown>>;
  readonly reason: string;
};

/** Collection + indexes plan for MongoDB apply. */
export type MongoCollectionPlan = {
  readonly name: string;
  readonly indexes: readonly MongoIndexSpec[];
};

/** Stable MongoDB apply plan (JSON-friendly). */
export type MongoApplyPlan = {
  readonly kind: 'stable apply plan';
  readonly provider: 'mongodb';
  readonly presetId: string;
  readonly description: string;
  readonly collections: readonly MongoCollectionPlan[];
};

/** Single field entry for a Firestore composite index. */
export type FirebaseIndexField = {
  readonly fieldPath: string;
  readonly order: 'ASCENDING' | 'DESCENDING';
};

/** Firestore composite index definition for firebase.json / gcloud. */
export type FirebaseCompositeIndex = {
  readonly collectionGroup: string;
  readonly queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  readonly fields: readonly FirebaseIndexField[];
  readonly reason: string;
};

/** Stable Firebase apply plan (JSON-friendly). */
export type FirebaseApplyPlan = {
  readonly kind: 'stable apply plan';
  readonly provider: 'firebase';
  readonly presetId: string;
  readonly description: string;
  readonly collections: readonly string[];
  readonly compositeIndexes: readonly FirebaseCompositeIndex[];
};

/** DynamoDB attribute definition for CreateTable. */
export type DynamoAttributeDefinition = {
  readonly AttributeName: string;
  readonly AttributeType: 'S' | 'N' | 'B';
};

/** DynamoDB key-schema element. */
export type DynamoKeySchemaElement = {
  readonly AttributeName: string;
  readonly KeyType: 'HASH' | 'RANGE';
};

/** DynamoDB global secondary index for unique/lookup columns. */
export type DynamoGlobalSecondaryIndex = {
  readonly IndexName: string;
  readonly KeySchema: readonly DynamoKeySchemaElement[];
  readonly Projection: { readonly ProjectionType: 'ALL' };
  readonly reason: string;
};

/** One DynamoDB table plan (id HASH + optional GSIs). */
export type DynamoTablePlan = {
  readonly tableName: string;
  readonly keySchema: readonly DynamoKeySchemaElement[];
  readonly attributeDefinitions: readonly DynamoAttributeDefinition[];
  readonly billingMode: 'PAY_PER_REQUEST';
  readonly globalSecondaryIndexes: readonly DynamoGlobalSecondaryIndex[];
};

/** Stable AWS DynamoDB apply plan (JSON-friendly). */
export type AwsApplyPlan = {
  readonly kind: 'stable apply plan';
  readonly provider: 'aws';
  readonly presetId: string;
  readonly description: string;
  readonly tables: readonly DynamoTablePlan[];
};

/** Union of executable NoSQL apply plans. */
export type NosqlApplyPlan = MongoApplyPlan | FirebaseApplyPlan | AwsApplyPlan;

// "license_key is not null" -> match, "status = 'active'" -> no match
const SIMPLE_IS_NOT_NULL = /^([a-zA-Z_][a-zA-Z0-9_]*)\s+is\s+not\s+null$/i;

const SQL_TYPE_BY_PRESET_TYPE = {
  text: 'text',
  uuid: 'uuid',
  boolean: 'boolean',
  timestamptz: 'timestamptz',
  jsonb: 'jsonb',
  numeric: 'numeric',
  // pgvector column for embeddings, e.g. `embedding vector(1536)`.
  // biome-ignore lint/security/noSecrets: pgvector dimension literal is not a secret.
  vector: 'vector(1536)',
} satisfies Readonly<Record<PresetColumnType, string>>;

/**
 * Resolve the SQL column type for a preset column.
 *
 * @param column - Preset column definition.
 * @returns Postgres SQL type for the column.
 * @example
 * const type = sqlType({ name: 'id', type: 'uuid' });
 */
const sqlType = (column: PresetColumn): string => SQL_TYPE_BY_PRESET_TYPE[column.type];

/**
 * Render a non-primary-key column definition.
 *
 * @param column - Preset column definition.
 * @returns SQL fragment for the column.
 * @example
 * const sql = renderColumnDef({ name: 'email', type: 'text', required: true });
 */
const renderColumnDef = (column: PresetColumn): string => {
  if (column.generated) {
    const storedType = column.name === 'search_vector' ? 'tsvector' : 'text';
    return `  ${column.name} ${storedType} generated always as (${column.generated}) stored`;
  }
  const parts = [`  ${column.name} ${sqlType(column)}`];
  if (column.required && !column.default) {
    parts.push('not null');
  }
  if (column.default) {
    parts.push(`default ${column.default}`);
  }
  if (column.unique) {
    parts.push('unique');
  }
  return parts.join(' ');
};

/**
 * Resolve an entity primary key.
 *
 * @param entity - Preset entity definition.
 * @returns Explicit primary key, or the kit default `id`.
 * @example
 * const primaryKey = resolvePrimaryKey(entity);
 */
const resolvePrimaryKey = (entity: PresetEntity): string => {
  if (entity.primaryKey !== undefined) {
    return entity.primaryKey;
  }
  return 'id';
};

/**
 * Render a primary-key column definition.
 *
 * @param pk - Primary key column name.
 * @param pkColumn - Matching column definition, if present.
 * @returns SQL column definition for the primary key.
 * @example
 * const sql = renderPrimaryKeyColumn('id', column);
 */
const renderPrimaryKeyColumn = (pk: string, pkColumn: PresetColumn | undefined): string => {
  if (pkColumn === undefined) {
    return `  ${pk} text primary key`;
  }
  if (pkColumn.type === 'uuid' && pkColumn.default?.includes('gen_random_uuid')) {
    return `  ${pk} uuid primary key default gen_random_uuid()`;
  }
  const required = pkColumn.required ? ' not null' : '';
  const defaultSql = pkColumn.default ? ` default ${pkColumn.default}` : '';
  return `  ${pk} ${sqlType(pkColumn)} primary key${required}${defaultSql}`;
};

/**
 * Render a create-table statement for one preset entity.
 *
 * @param entity - Preset entity definition.
 * @returns SQL create-table statement.
 * @example
 * const sql = renderCreateTable(entity);
 */
const renderCreateTable = (entity: PresetEntity): string => {
  const pk = resolvePrimaryKey(entity);
  const pkColumn = entity.columns.find((col) => col.name === pk);
  const nonPkColumns = entity.columns.filter((col) => col.name !== pk || col.generated);

  const columnLines: string[] = [];
  if (pkColumn && !pkColumn.generated) {
    columnLines.push(renderPrimaryKeyColumn(pk, pkColumn));
  } else if (pkColumn === undefined) {
    columnLines.push(renderPrimaryKeyColumn(pk, undefined));
  }

  for (const column of nonPkColumns) {
    if (column.name !== pk || column.generated) {
      columnLines.push(renderColumnDef(column));
    }
  }

  const fkLines: string[] = [];
  for (const column of entity.columns) {
    if (column.references) {
      fkLines.push(
        `  constraint ${entity.name}_${column.name}_fkey foreign key (${column.name}) references public.${column.references.table} (${column.references.column}) on delete cascade`,
      );
    }
  }

  const allLines = [...columnLines, ...fkLines];
  return `create table if not exists public.${entity.name} (\n${allLines.join(',\n')}\n);`;
};

/**
 * Render one preset index.
 *
 * @param manifest - Parent preset manifest.
 * @param index - Index definition from the manifest.
 * @returns SQL create-index statement.
 * @example
 * const sql = renderIndex(manifest, manifest.indexes[0]);
 */
const renderIndex = (
  _manifest: PresetManifest,
  index: PresetManifest['indexes'][number],
): string => {
  const idxName = `${index.table}_${index.columns.join('_')}_idx`;
  const unique = index.unique ? 'unique ' : '';
  const method = index.method ? ` using ${index.method}` : '';
  const where = index.where ? ` where ${index.where}` : '';
  // pgvector HNSW/IVFFlat require an operator class (cosine / L2 / ip).
  // Plain `(embedding)` fails: "data type vector has no default operator class".
  const isVectorAnn = index.method === 'hnsw' || index.method === 'ivfflat';
  const cols = isVectorAnn
    ? index.columns.map((column) => `${column} vector_cosine_ops`).join(', ')
    : index.columns.join(', ');
  return `-- ${index.reason}\ncreate ${unique}index if not exists ${idxName} on public.${index.table}${method} (${cols})${where};`;
};

/**
 * Render row-level security policies for one entity.
 *
 * @param manifest - Parent preset manifest.
 * @param entityName - Entity/table name to protect.
 * @returns SQL RLS block, or an empty string for `none`.
 * @example
 * const sql = renderRls(manifest, 'orders');
 */
const renderRls = (manifest: PresetManifest, entityName: string): string => {
  const mode: PresetRlsMode = manifest.rls;
  if (mode === 'none') {
    return '';
  }

  const lines: string[] = [`alter table public.${entityName} enable row level security;`];

  if (mode === 'service-role-only') {
    lines.push(
      `-- RLS enabled with no anon/authenticated policies — service-role only (${manifest.id})`,
    );
    return lines.join('\n');
  }

  if (mode === 'user-owned' && manifest.rlsColumn) {
    const col = manifest.rlsColumn;
    lines.push(`
create policy "${entityName}_select_own"
  on public.${entityName} for select to authenticated
  using (auth.uid()::text = ${col} or public.is_admin());

create policy "${entityName}_insert_own"
  on public.${entityName} for insert to authenticated
  with check (auth.uid()::text = ${col} or public.is_admin());

create policy "${entityName}_update_own"
  on public.${entityName} for update to authenticated
  using (auth.uid()::text = ${col} or public.is_admin());

create policy "${entityName}_delete_own"
  on public.${entityName} for delete to authenticated
  using (auth.uid()::text = ${col} or public.is_admin());`);
    return lines.join('\n');
  }

  if (mode === 'org-owned' && manifest.orgColumn) {
    const orgCol = manifest.orgColumn;
    lines.push(`
create policy "${entityName}_select_org"
  on public.${entityName} for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.organization_members om
      where om.org_id = ${entityName}.${orgCol} and om.user_id = auth.uid()::text
    )
  );

create policy "${entityName}_insert_org"
  on public.${entityName} for insert to authenticated
  with check (
    public.is_admin() or exists (
      select 1 from public.organization_members om
      where om.org_id = ${entityName}.${orgCol} and om.user_id = auth.uid()::text
    )
  );

create policy "${entityName}_update_org"
  on public.${entityName} for update to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.organization_members om
      where om.org_id = ${entityName}.${orgCol} and om.user_id = auth.uid()::text
    )
  );

create policy "${entityName}_delete_org"
  on public.${entityName} for delete to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.organization_members om
      where om.org_id = ${entityName}.${orgCol} and om.user_id = auth.uid()::text
    )
  );`);
    return lines.join('\n');
  }

  if (mode === 'public-read-authenticated-write' && manifest.rlsColumn) {
    const col = manifest.rlsColumn;
    lines.push(`
create policy "${entityName}_select_all"
  on public.${entityName} for select to authenticated using (true);

create policy "${entityName}_insert_own"
  on public.${entityName} for insert to authenticated
  with check (auth.uid()::text = ${col});

create policy "${entityName}_update_own"
  on public.${entityName} for update to authenticated
  using (auth.uid()::text = ${col});

create policy "${entityName}_delete_own"
  on public.${entityName} for delete to authenticated
  using (auth.uid()::text = ${col});`);
    return lines.join('\n');
  }

  return lines.join('\n');
};

/**
 * Render a Postgres SQL migration for a preset manifest.
 *
 * @param manifest - Preset manifest to render.
 * @param provider - Postgres provider target.
 * @returns SQL migration text.
 * @example
 * const sql = renderPostgresPreset(manifest, 'supabase');
 */
export const renderPostgresPreset = (
  manifest: PresetManifest,
  provider: PostgresProviderName,
): string => {
  const description = manifest.description === undefined ? '' : manifest.description;
  const parts: string[] = [
    `-- VybeKiit preset: ${manifest.id} v${manifest.version} (${provider})`,
    `-- ${description}`.trim(),
  ];

  if (manifest.extensions?.includes('vector')) {
    parts.push('create extension if not exists vector;');
  }

  // Supabase helpers (is_admin, realtime) call auth.uid() / supabase_realtime —
  // only inject them when the target actually has those roles/objects.
  const supabaseOnly = provider === 'supabase';
  const helpers = manifest.helpers === undefined ? [] : manifest.helpers;
  if (supabaseOnly) {
    for (const helper of helpers) {
      const sql = PRESET_HELPERS[helper];
      if (sql !== undefined) {
        parts.push(sql);
      }
    }
  }

  for (const entity of manifest.entities) {
    parts.push(renderCreateTable(entity));
  }

  for (const index of manifest.indexes) {
    parts.push(renderIndex(manifest, index));
  }

  for (const entity of manifest.entities) {
    if (supabaseOnly) {
      const rls = renderRls(manifest, entity.name);
      if (rls) {
        parts.push(rls);
      }
      continue;
    }
    // Neon / Railway: tables + indexes only for authz; skip policies that target
    // the Supabase `authenticated` role (that role does not exist on plain Postgres).
    if (manifest.rls !== 'none') {
      parts.push(
        [
          `alter table public.${entity.name} enable row level security;`,
          `-- RLS on; Supabase role policies omitted for ${provider} (no authenticated/auth.uid).`,
        ].join('\n'),
      );
    }
  }

  if (supabaseOnly && manifest.id === 'realtime_publications') {
    parts.push(renderRealtimeGrants(REALTIME_TABLES));
  }

  return `${parts.filter(Boolean).join('\n\n')}\n`;
};

/**
 * Build a stable index name from table + columns.
 *
 * @param index - Preset index definition.
 * @returns Deterministic index name.
 * @example
 * const name = indexName({ table: 'orders', columns: ['order_id'], reason: 'lookup' });
 */
const indexName = (index: PresetIndex): string => `${index.table}_${index.columns.join('_')}_idx`;

/**
 * Map a simple SQL-style partial where clause to a Mongo partialFilterExpression.
 *
 * Only supports `column is not null`. Complex predicates are skipped.
 *
 * @param where - Optional SQL where fragment from the preset index.
 * @returns Mongo partial filter, or undefined when not representable.
 * @example
 * const filter = mongoPartialFromWhere('license_key is not null');
 */
const mongoPartialFromWhere = (
  where: string | undefined,
): Readonly<Record<string, unknown>> | undefined => {
  if (where === undefined || where.trim() === '') {
    return;
  }
  const match = SIMPLE_IS_NOT_NULL.exec(where.trim());
  if (match === null) {
    return;
  }
  const column = match[1];
  if (column === undefined) {
    return;
  }
  return { [column]: { $exists: true, $ne: null } };
};

/**
 * Map a preset index to a Mongo createIndex specification.
 *
 * @param index - Preset index definition.
 * @returns Mongo index keys + options.
 * @example
 * const spec = toMongoIndexSpec(manifest.indexes[0]);
 */
const toMongoIndexSpec = (index: PresetIndex): MongoIndexSpec => {
  const keys: Record<string, 1 | -1> = {};
  for (const column of index.columns) {
    keys[column] = 1;
  }
  const partialFilterExpression = mongoPartialFromWhere(index.where);
  return {
    name: indexName(index),
    keys,
    reason: index.reason,
    ...(index.unique === true ? { unique: true } : {}),
    ...(partialFilterExpression === undefined ? {} : { partialFilterExpression }),
  };
};

/**
 * Build a MongoDB apply plan from a preset manifest.
 *
 * @param manifest - Preset manifest to plan.
 * @returns Collection names + createIndex specs.
 * @example
 * const plan = buildMongoApplyPlan(manifest);
 */
export const buildMongoApplyPlan = (manifest: PresetManifest): MongoApplyPlan => {
  const description = manifest.description === undefined ? '' : manifest.description;
  const collections = manifest.entities.map((entity) => ({
    name: entity.name,
    indexes: manifest.indexes.filter((index) => index.table === entity.name).map(toMongoIndexSpec),
  }));
  return {
    kind: 'stable apply plan',
    provider: 'mongodb',
    presetId: manifest.id,
    description,
    collections,
  };
};

/**
 * Build a Firebase/Firestore apply plan from a preset manifest.
 *
 * Single-field equality indexes are automatic in Firestore; multi-field and
 * explicit unique/lookup indexes are emitted as composite index entries.
 *
 * @param manifest - Preset manifest to plan.
 * @returns Collection names + composite index fieldPaths.
 * @example
 * const plan = buildFirebaseApplyPlan(manifest);
 */
export const buildFirebaseApplyPlan = (manifest: PresetManifest): FirebaseApplyPlan => {
  const description = manifest.description === undefined ? '' : manifest.description;
  const collections = manifest.entities.map((entity) => entity.name);
  const compositeIndexes: FirebaseCompositeIndex[] = [];

  for (const index of manifest.indexes) {
    // Single-field ASC is automatic; still emit when unique so apply notes stay complete.
    const fields: FirebaseIndexField[] = index.columns.map((fieldPath) => ({
      fieldPath,
      order: 'ASCENDING',
    }));
    compositeIndexes.push({
      collectionGroup: index.table,
      queryScope: 'COLLECTION',
      fields,
      reason: index.reason,
    });
  }

  return {
    kind: 'stable apply plan',
    provider: 'firebase',
    presetId: manifest.id,
    description,
    collections,
    compositeIndexes,
  };
};

/**
 * Map a preset column type to a DynamoDB scalar attribute type.
 *
 * @param columnType - Preset column type.
 * @returns DynamoDB AttributeType.
 * @example
 * const attr = dynamoAttributeType('uuid');
 */
const dynamoAttributeType = (columnType: PresetColumnType): 'S' | 'N' | 'B' => {
  if (columnType === 'numeric') {
    return 'N';
  }
  return 'S';
};

/**
 * Resolve the DynamoDB attribute type for a named column on an entity.
 *
 * @param entity - Entity that owns the column.
 * @param columnName - Column / attribute name.
 * @returns Attribute type (defaults to string).
 * @example
 * const type = attributeTypeForColumn(entity, 'order_id');
 */
const attributeTypeForColumn = (entity: PresetEntity, columnName: string): 'S' | 'N' | 'B' => {
  const column = entity.columns.find((entry) => entry.name === columnName);
  if (column === undefined) {
    return 'S';
  }
  return dynamoAttributeType(column.type);
};

/**
 * Build DynamoDB GSI definitions for unique/lookup indexes when columns allow.
 *
 * Uses the first index column as HASH and an optional second column as RANGE.
 * Skips indexes whose only column is the table primary key.
 *
 * @param entity - Parent entity (for attribute types).
 * @param indexes - Indexes targeting this entity's table.
 * @returns GSI definitions + attribute names required beyond the primary key.
 * @example
 * const { gsis, extraAttributes } = buildDynamoGsis(entity, indexes);
 */
const buildDynamoGsis = (
  entity: PresetEntity,
  indexes: readonly PresetIndex[],
): {
  readonly gsis: readonly DynamoGlobalSecondaryIndex[];
  readonly extraAttributes: readonly DynamoAttributeDefinition[];
} => {
  const pk = resolvePrimaryKey(entity);
  const gsis: DynamoGlobalSecondaryIndex[] = [];
  const attributeByName = new Map<string, DynamoAttributeDefinition>();

  for (const index of indexes) {
    const hashKey = index.columns[0];
    if (hashKey === undefined) {
      continue;
    }
    if (index.columns.length === 1 && hashKey === pk) {
      continue;
    }

    const keySchema: DynamoKeySchemaElement[] = [{ AttributeName: hashKey, KeyType: 'HASH' }];
    attributeByName.set(hashKey, {
      AttributeName: hashKey,
      AttributeType: attributeTypeForColumn(entity, hashKey),
    });

    const rangeKey = index.columns[1];
    if (rangeKey !== undefined) {
      keySchema.push({ AttributeName: rangeKey, KeyType: 'RANGE' });
      attributeByName.set(rangeKey, {
        AttributeName: rangeKey,
        AttributeType: attributeTypeForColumn(entity, rangeKey),
      });
    }

    gsis.push({
      IndexName: `${index.table}_${index.columns.join('_')}_gsi`,
      KeySchema: keySchema,
      Projection: { ProjectionType: 'ALL' },
      reason: index.reason,
    });
  }

  return { gsis, extraAttributes: [...attributeByName.values()] };
};

/**
 * Build an AWS DynamoDB apply plan from a preset manifest.
 *
 * @param manifest - Preset manifest to plan.
 * @returns Tables with id HASH key + GSI definitions.
 * @example
 * const plan = buildAwsApplyPlan(manifest);
 */
export const buildAwsApplyPlan = (manifest: PresetManifest): AwsApplyPlan => {
  const description = manifest.description === undefined ? '' : manifest.description;
  const tables = manifest.entities.map((entity) => {
    const pk = resolvePrimaryKey(entity);
    const entityIndexes = manifest.indexes.filter((index) => index.table === entity.name);
    const { gsis, extraAttributes } = buildDynamoGsis(entity, entityIndexes);
    const pkAttribute: DynamoAttributeDefinition = {
      AttributeName: pk,
      AttributeType: attributeTypeForColumn(entity, pk),
    };
    const seen = new Set<string>([pk]);
    const attributeDefinitions: DynamoAttributeDefinition[] = [pkAttribute];
    for (const attr of extraAttributes) {
      if (!seen.has(attr.AttributeName)) {
        seen.add(attr.AttributeName);
        attributeDefinitions.push(attr);
      }
    }
    return {
      tableName: entity.name,
      keySchema: [{ AttributeName: pk, KeyType: 'HASH' as const }],
      attributeDefinitions,
      billingMode: 'PAY_PER_REQUEST' as const,
      globalSecondaryIndexes: gsis,
    };
  });
  return {
    kind: 'stable apply plan',
    provider: 'aws',
    presetId: manifest.id,
    description,
    tables,
  };
};

/**
 * Build a structured executable NoSQL apply plan for a preset.
 *
 * @param manifest - Preset manifest to plan.
 * @param provider - NoSQL provider target.
 * @returns JSON-friendly apply plan.
 * @example
 * const plan = buildNosqlApplyPlan(manifest, 'mongodb');
 */
export const buildNosqlApplyPlan = (
  manifest: PresetManifest,
  provider: NosqlProviderName,
): NosqlApplyPlan => {
  if (provider === 'mongodb') {
    return buildMongoApplyPlan(manifest);
  }
  if (provider === 'firebase') {
    return buildFirebaseApplyPlan(manifest);
  }
  return buildAwsApplyPlan(manifest);
};

/**
 * Render a preset for the requested provider.
 *
 * @param manifest - Preset manifest to render.
 * @param provider - Target data provider.
 * @returns Rendered SQL for Postgres providers or stable NoSQL apply notes.
 * @example
 * const rendered = renderPreset(manifest, 'supabase');
 */
export const renderPreset = (
  manifest: PresetManifest,
  provider: PostgresProviderName | NosqlProviderName,
): RenderedPreset => {
  const status = manifest.providers === undefined ? undefined : manifest.providers[provider];
  if (provider === 'mongodb' || provider === 'firebase' || provider === 'aws') {
    return {
      presetId: manifest.id,
      provider,
      nosqlNotes: renderNosqlPreset(manifest, provider),
    };
  }
  if (status === 'planned') {
    return {
      presetId: manifest.id,
      provider,
      sql: `-- Planned for ${provider}; use supabase/neon/railway in v1.\n`,
    };
  }
  return {
    presetId: manifest.id,
    provider,
    sql: renderPostgresPreset(manifest, provider),
  };
};

/**
 * Render a stable NoSQL apply plan as a JSON string for CLI display and apply.
 *
 * @param manifest - Preset manifest to describe.
 * @param provider - NoSQL provider target.
 * @returns JSON string of the executable apply plan.
 * @example
 * const notes = renderNosqlPreset(manifest, 'mongodb');
 */
export const renderNosqlPreset = (manifest: PresetManifest, provider: NosqlProviderName): string =>
  JSON.stringify(buildNosqlApplyPlan(manifest, provider), null, 2);
