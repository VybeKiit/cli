import { PRESET_HELPERS, REALTIME_TABLES, renderRealtimeGrants } from './helpers';
import type {
  PostgresProviderName,
  PresetColumn,
  PresetColumnType,
  PresetEntity,
  PresetManifest,
  PresetRlsMode,
  RenderedPreset,
} from './types';

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
  const cols = index.columns.join(', ');
  const idxName = `${index.table}_${index.columns.join('_')}_idx`;
  const unique = index.unique ? 'unique ' : '';
  const method = index.method ? ` using ${index.method}` : '';
  const where = index.where ? ` where ${index.where}` : '';
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

  const helpers = manifest.helpers === undefined ? [] : manifest.helpers;
  for (const helper of helpers) {
    const sql = PRESET_HELPERS[helper];
    if (sql !== undefined) {
      parts.push(sql);
    }
  }

  for (const entity of manifest.entities) {
    parts.push(renderCreateTable(entity));
  }

  for (const index of manifest.indexes) {
    parts.push(renderIndex(manifest, index));
  }

  for (const entity of manifest.entities) {
    const rls = renderRls(manifest, entity.name);
    if (rls) {
      parts.push(rls);
    }
  }

  if (manifest.id === 'realtime_publications') {
    parts.push(renderRealtimeGrants(REALTIME_TABLES));
  }

  return `${parts.filter(Boolean).join('\n\n')}\n`;
};

/**
 * Render a preset for the requested provider.
 *
 * @param manifest - Preset manifest to render.
 * @param provider - Target data provider.
 * @returns Rendered SQL for Postgres providers or notes for planned NoSQL providers.
 * @example
 * const rendered = renderPreset(manifest, 'supabase');
 */
export const renderPreset = (
  manifest: PresetManifest,
  provider: PostgresProviderName | 'mongodb' | 'firebase' | 'aws',
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
 * Render NoSQL implementation notes for a preset.
 *
 * @param manifest - Preset manifest to describe.
 * @param provider - NoSQL provider target.
 * @returns Markdown notes for the provider-specific implementation plan.
 * @example
 * const notes = renderNosqlPreset(manifest, 'mongodb');
 */
const renderNosqlPreset = (
  manifest: PresetManifest,
  provider: 'mongodb' | 'firebase' | 'aws',
): string => {
  const description = manifest.description === undefined ? '' : manifest.description;
  const lines: string[] = [
    `# VybeKiit preset: ${manifest.id} (${provider}) — v1.1 planned`,
    `# ${description}`,
  ];
  for (const entity of manifest.entities) {
    lines.push(`\n## Collection/table: ${entity.name}`);
    for (const column of entity.columns) {
      lines.push(`- ${column.name}: ${column.type}${column.required ? ' (required)' : ''}`);
    }
  }
  for (const index of manifest.indexes) {
    const unique = index.unique ? ' UNIQUE' : '';
    lines.push(`\nIndex${unique} on ${index.table}(${index.columns.join(', ')}) — ${index.reason}`);
  }
  if (provider === 'mongodb') {
    lines.push('\n// db.collection(name).createIndex({ ... })');
  }
  if (provider === 'aws') {
    lines.push('\n// DynamoDB GSI or attribute definitions per entity');
  }
  if (provider === 'firebase') {
    lines.push('\n// Firestore composite indexes in firebase.json');
  }
  return lines.join('\n');
};
