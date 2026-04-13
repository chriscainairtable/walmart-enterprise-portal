import { STEPS } from '@/lib/storySteps';

export const revalidate = 60;

const PAT = process.env.AIRTABLE_PAT!;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;
  const id = parseInt(stepId, 10);
  const step = STEPS.find(s => s.id === id);
  if (!step) return Response.json({ error: 'Step not found' }, { status: 404 });

  try {
    const records = await fetchStepData(step.baseId, step.query);
    return Response.json({ records });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg, records: [] }, { status: 200 });
  }
}

async function fetchStepData(
  baseId: string,
  query: { tableId: string; fields: string[]; filterByFormula?: string; maxRecords?: number; sort?: { field: string; direction: string }[] }
) {
  const records: Record<string, unknown>[] = [];
  let offset: string | undefined;
  const maxRecords = query.maxRecords ?? 100;

  do {
    const p = new URLSearchParams();
    query.fields.forEach(f => p.append('fields[]', f));
    if (query.filterByFormula) p.set('filterByFormula', query.filterByFormula);
    if (query.sort) {
      query.sort.forEach((s, i) => {
        p.set(`sort[${i}][field]`, s.field);
        p.set(`sort[${i}][direction]`, s.direction);
      });
    }
    p.set('pageSize', String(Math.min(maxRecords - records.length, 100)));
    if (offset) p.set('offset', offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${query.tableId}?${p}`,
      { headers: { Authorization: `Bearer ${PAT}` }, cache: 'no-store' }
    );
    if (!res.ok) break;
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset && records.length < maxRecords);

  return records.slice(0, maxRecords);
}
