import { fetchCrossOrgDeps } from '@/lib/airtable';

export async function GET() {
  try {
    const data = await fetchCrossOrgDeps();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
