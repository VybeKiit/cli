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

function tableName(entity: string): string {
  return entity
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function sqlType(type: EntityFieldType): string {
  switch (type) {
    case 'number':
      return 'numeric';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'timestamptz';
    default:
      return 'text';
  }
}

function emitSqlTable(collection: DataModelPlan['collections'][number]): string {
  const cols = collection.fields
    .map((f) => `  ${f.name} ${sqlType(f.type)}${f.required ? ' not null' : ''}`)
    .join(',\n');
  return `create table if not exists ${collection.name} (\n  id uuid primary key default gen_random_uuid(),\n${cols}\n);`;
}

function emitFirebaseShape(collection: DataModelPlan['collections'][number]): object {
  return {
    collection: collection.name,
    fields: Object.fromEntries(collection.fields.map((f) => [f.name, f.type])),
    documentId: 'id',
  };
}

export function planDataModel(
  entities: EntityInput[],
  provider: DataProviderName = 'supabase',
): DataModelPlan {
  const collections = entities.map((entity) => ({
    name: tableName(entity.name),
    primaryKey: 'id' as const,
    fields: entity.fields.map((f) => ({
      name: f.name.replace(/\s+/g, '_').toLowerCase(),
      type: f.type,
      required: true,
    })),
  }));

  const relations: DataModelPlan['relations'] = [];
  for (const entity of entities) {
    const from = tableName(entity.name);
    for (const rel of entity.relatesTo ?? []) {
      const to = tableName(rel.entity);
      const foreignKey = `${to}_id`;
      relations.push({ from, to, foreignKey, type: rel.cardinality });
      const target = collections.find((c) => c.name === from);
      if (target && !target.fields.some((f) => f.name === foreignKey)) {
        target.fields.push({ name: foreignKey, type: 'string', required: false });
      }
    }
  }

  const buyerSummary = `Your app will remember ${collections.map((c) => c.name.replace(/_/g, ' ')).join(' and ')}.`;

  const migrations: DataModelPlan['migrations'] = [];
  if (provider === 'supabase' || provider === 'neon') {
    const sqlParts = collections.map(emitSqlTable);
    for (const rel of relations) {
      sqlParts.push(
        `alter table ${rel.from} add column if not exists ${rel.foreignKey} uuid references ${rel.to}(id);`,
      );
    }
    migrations.push({ provider, sql: sqlParts.join('\n\n') });
  } else if (provider === 'firebase') {
    migrations.push({
      provider,
      firestoreShape: Object.fromEntries(collections.map((c) => [c.name, emitFirebaseShape(c)])),
    });
  } else if (provider === 'mongodb') {
    migrations.push({
      provider,
      notes: collections
        .map((c) => `Collection "${c.name}" with fields: ${c.fields.map((f) => f.name).join(', ')}`)
        .join('; '),
    });
  } else if (provider === 'aws') {
    migrations.push({
      provider,
      notes: collections.map((c) => `DynamoDB table "${c.name}" partition key id`).join('; '),
    });
  } else {
    migrations.push({
      provider: 'local',
      notes: collections.map((c) => `In-memory collection "${c.name}"`).join('; '),
    });
  }

  return { collections, relations, migrations, buyerSummary };
}

export function renderDataModelSummary(plan: DataModelPlan): string {
  return plan.buyerSummary;
}
