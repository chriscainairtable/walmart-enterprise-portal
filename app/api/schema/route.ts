import {
  BASE_L1, BASE_BEACON, BASE_LIGHTHOUSE,
  BASE_SWITCHBOARD, BASE_ORCHESTRATOR,
} from '@/lib/airtable';

const PAT = process.env.AIRTABLE_PAT!;

const ALL_BASES: Record<string, string> = {
  [BASE_L1]:          'L1 Strategic Portfolio',
  [BASE_BEACON]:      'Beacon Shell',
  [BASE_LIGHTHOUSE]:  'Lighthouse',
  [BASE_SWITCHBOARD]: 'L3 Switchboard',
  [BASE_ORCHESTRATOR]:'Orchestrator',
};

export type SchemaField = {
  id: string;
  name: string;
  type: string;
  sharedWith: string[]; // base names that also have this field name
};

export type SchemaTable = {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
};

export type SchemaResponse = {
  baseId: string;
  baseName: string;
  tables: SchemaTable[];
  sharedFieldSummary: { fieldName: string; bases: string[] }[];
};

async function fetchBaseSchema(baseId: string): Promise<SchemaTable[]> {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    { headers: { Authorization: `Bearer ${PAT}` }, next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tables || []).map((t: { id: string; name: string; description?: string; fields: { id: string; name: string; type: string }[] }) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    fields: (t.fields || []).map((f: { id: string; name: string; type: string }) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      sharedWith: [], // filled in after cross-base analysis
    })),
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseId = searchParams.get('base');
  if (!baseId || !ALL_BASES[baseId]) {
    return Response.json({ error: 'Unknown base' }, { status: 400 });
  }

  // Fetch all base schemas in parallel for overlap analysis
  const allBaseIds = Object.keys(ALL_BASES);
  const allSchemas = await Promise.all(
    allBaseIds.map(id => fetchBaseSchema(id).then(tables => ({ id, tables })))
  );

  // Build field name → base names map across ALL bases
  const fieldToBase: Record<string, string[]> = {};
  allSchemas.forEach(({ id, tables }) => {
    const baseName = ALL_BASES[id];
    tables.forEach(table => {
      table.fields.forEach(field => {
        if (!fieldToBase[field.name]) fieldToBase[field.name] = [];
        if (!fieldToBase[field.name].includes(baseName)) {
          fieldToBase[field.name].push(baseName);
        }
      });
    });
  });

  // Annotate fields of the requested base with sharedWith
  const targetSchema = allSchemas.find(s => s.id === baseId);
  if (!targetSchema) {
    return Response.json({ error: 'Schema fetch failed' }, { status: 500 });
  }
  const thisBaseName = ALL_BASES[baseId];
  const annotatedTables = targetSchema.tables.map(table => ({
    ...table,
    fields: table.fields.map(field => ({
      ...field,
      sharedWith: (fieldToBase[field.name] || []).filter(b => b !== thisBaseName),
    })),
  }));

  // Summary: fields shared with 2+ bases
  const sharedFieldSummary = Object.entries(fieldToBase)
    .filter(([, bases]) => bases.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .map(([fieldName, bases]) => ({ fieldName, bases }));

  const response: SchemaResponse = {
    baseId,
    baseName: thisBaseName,
    tables: annotatedTables,
    sharedFieldSummary,
  };

  return Response.json(response);
}
