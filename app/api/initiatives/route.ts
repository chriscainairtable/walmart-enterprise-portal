import { fetchInitiatives, fetchMSC } from '@/lib/airtable';

export async function GET() {
  try {
    const [initiatives, msc] = await Promise.all([fetchInitiatives(), fetchMSC()]);
    // Attach MSC caps to each initiative
    const mscByInitId: Record<string, typeof msc> = {};
    msc.forEach(cap => {
      cap.initiativeIds.forEach(id => {
        if (!mscByInitId[id]) mscByInitId[id] = [];
        mscByInitId[id].push(cap);
      });
    });
    const enriched = initiatives.map(i => ({
      ...i,
      capabilities: mscByInitId[i.id] || [],
    }));
    return Response.json(enriched);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
