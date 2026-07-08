export type DataProviderName = 'supabase' | 'neon' | 'firebase' | 'mongodb' | 'aws' | 'local';

export type EntityFieldType = 'string' | 'number' | 'boolean' | 'date';

export type EntityInput = {
  name: string;
  fields: { name: string; type: EntityFieldType }[];
  relatesTo?: { entity: string; cardinality: 'one' | 'many' }[];
};

export type FieldDef = {
  name: string;
  type: EntityFieldType;
  required?: boolean;
};

export type DataModelPlan = {
  collections: { name: string; fields: FieldDef[]; primaryKey: 'id' }[];
  relations: { from: string; to: string; foreignKey: string; type: 'one' | 'many' }[];
  migrations: {
    provider: DataProviderName;
    sql?: string;
    firestoreShape?: object;
    notes?: string;
  }[];
  buyerSummary: string;
};

type DataModelCollection = DataModelPlan['collections'][number];
type DataModelRelation = DataModelPlan['relations'][number];
type DataModelMigration = DataModelPlan['migrations'][number];
type MigrationBuilder = (
  collections: readonly DataModelCollection[],
  relations: readonly DataModelRelation[],
) => DataModelMigration;

const SQL_TYPE_BY_FIELD_TYPE: Readonly<Record<EntityFieldType, string>> = {
  string: 'text',
  number: 'numeric',
  boolean: 'boolean',
  date: 'timestamptz',
};

// "user profile" -> "user_profile"
const WHITESPACE_PATTERN = /\s+/g;

// "plan!" -> "plan"
const UNSAFE_TABLE_CHARACTER_PATTERN = /[^a-z0-9_]/g;

// "user_profile" -> "user profile"
const UNDERSCORE_PATTERN = /_/g;

const tableName = (entity: string): string => {
  const normalized = entity.trim().toLowerCase();
  const underscored = normalized.replace(WHITESPACE_PATTERN, '_');
  return underscored.replace(UNSAFE_TABLE_CHARACTER_PATTERN, '');
};

const fieldName = (field: string): string =>
  field.trim().toLowerCase().replace(WHITESPACE_PATTERN, '_');

const sqlType = (type: EntityFieldType): string => SQL_TYPE_BY_FIELD_TYPE[type];

const emitSqlTable = (collection: DataModelCollection): string => {
  const cols = collection.fields
    .map((f) => `  ${f.name} ${sqlType(f.type)}${f.required ? ' not null' : ''}`)
    .join(',\n');
  return `create table if not exists ${collection.name} (\n  id uuid primary key default gen_random_uuid(),\n${cols}\n);`;
};

const emitFirebaseShape = (collection: DataModelCollection): object => ({
  collection: collection.name,
  fields: Object.fromEntries(collection.fields.map((f) => [f.name, f.type])),
  documentId: 'id',
});

const buildCollections = (entities: readonly EntityInput[]): DataModelCollection[] =>
  entities.map((entity) => ({
    name: tableName(entity.name),
    primaryKey: 'id' as const,
    fields: entity.fields.map((field) => ({
      name: fieldName(field.name),
      type: field.type,
      required: true,
    })),
  }));

const buildRelations = (
  entities: readonly EntityInput[],
  collections: readonly DataModelCollection[],
): DataModelRelation[] => {
  const relations: DataModelRelation[] = [];
  for (const entity of entities) {
    const from = tableName(entity.name);
    const relatedEntities = entity.relatesTo;
    if (relatedEntities !== undefined) {
      for (const rel of relatedEntities) {
        const to = tableName(rel.entity);
        const foreignKey = `${to}_id`;
        relations.push({ from, to, foreignKey, type: rel.cardinality });
        const target = collections.find((collection) => collection.name === from);
        if (target !== undefined && !target.fields.some((field) => field.name === foreignKey)) {
          target.fields.push({ name: foreignKey, type: 'string', required: false });
        }
      }
    }
  }
  return relations;
};

const buildSqlMigration = (
  provider: Extract<DataProviderName, 'supabase' | 'neon'>,
): MigrationBuilder => {
  const buildMigration: MigrationBuilder = (collections, relations) => {
    const sqlParts = collections.map(emitSqlTable);
    for (const rel of relations) {
      sqlParts.push(
        `alter table ${rel.from} add column if not exists ${rel.foreignKey} uuid references ${rel.to}(id);`,
      );
    }
    return { provider, sql: sqlParts.join('\n\n') };
  };
  return buildMigration;
};

const buildFirebaseMigration: MigrationBuilder = (collections) => ({
  provider: 'firebase',
  firestoreShape: Object.fromEntries(
    collections.map((collection) => [collection.name, emitFirebaseShape(collection)]),
  ),
});

const buildMongodbMigration: MigrationBuilder = (collections) => ({
  provider: 'mongodb',
  notes: collections
    .map(
      (collection) =>
        `Collection "${collection.name}" with fields: ${collection.fields.map((field) => field.name).join(', ')}`,
    )
    .join('; '),
});

const buildAwsMigration: MigrationBuilder = (collections) => ({
  provider: 'aws',
  notes: collections
    .map((collection) => `DynamoDB table "${collection.name}" partition key id`)
    .join('; '),
});

const buildLocalMigration: MigrationBuilder = (collections) => ({
  provider: 'local',
  notes: collections.map((collection) => `In-memory collection "${collection.name}"`).join('; '),
});

const MIGRATION_BUILDERS: Readonly<Record<DataProviderName, MigrationBuilder>> = {
  supabase: buildSqlMigration('supabase'),
  neon: buildSqlMigration('neon'),
  firebase: buildFirebaseMigration,
  mongodb: buildMongodbMigration,
  aws: buildAwsMigration,
  local: buildLocalMigration,
};

const renderCollectionsSummary = (collections: readonly DataModelCollection[]): string =>
  collections.map((collection) => collection.name.replace(UNDERSCORE_PATTERN, ' ')).join(' and ');

/**
 * Run plan data model.
 *
 * @param entities - entities input.
 * @param provider - provider input.
 * @returns The plan data model result.
 * @example
 * const result = planDataModel(entities, provider);
 */
export const planDataModel = (
  entities: EntityInput[],
  provider: DataProviderName = 'supabase',
): DataModelPlan => {
  const collections = buildCollections(entities);
  const relations = buildRelations(entities, collections);
  const buyerSummary = `Your app will remember ${renderCollectionsSummary(collections)}.`;
  const buildMigration = MIGRATION_BUILDERS[provider];
  const migrations = [buildMigration(collections, relations)];

  return { collections, relations, migrations, buyerSummary };
};

/**
 * Run render data model summary.
 *
 * @param plan - plan input.
 * @returns The rendered render data model summary text.
 * @example
 * const result = renderDataModelSummary(plan);
 */
export const renderDataModelSummary = (plan: DataModelPlan): string => plan.buyerSummary;
