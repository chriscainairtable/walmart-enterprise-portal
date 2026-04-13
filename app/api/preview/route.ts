import { NextRequest } from 'next/server';

const PAT = process.env.AIRTABLE_PAT!;

const BASE_L1          = 'appCNBYNGcbSj7fNq';
const BASE_BEACON      = 'appwkie9ju54wkfYT';
const BASE_LIGHTHOUSE  = 'appy9LBctWK5O1lEb';
const BASE_SWITCHBOARD = 'appEYNscRBWFAlGsT';

async function fetchAll(baseId: string, tableId: string, fields: string[]) {
  const records: Record<string, unknown>[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    fields.forEach(f => params.append('fields[]', f));
    if (offset) params.set('offset', offset);
    params.set('pageSize', '100');
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}?${params}`,
      { headers: { Authorization: `Bearer ${PAT}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return records;
}

function sel(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'object' && v !== null && 'name' in v) return (v as { name: string }).name;
  return String(v);
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');

  try {
    switch (type) {
      case 'initiatives': {
        const recs = await fetchAll(BASE_L1, 'tbl2ExbwxFOFpEtom',
          ['Name', 'Status', 'Source Org', 'Priority', 'Pillar', 'ATL/BTL']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Name'] ?? '',
            status: sel(f['Status']),
            org: f['Source Org'] ?? '',
            priority: sel(f['Priority']),
            pillar: sel(f['Pillar']),
            atlbtl: sel(f['ATL/BTL']),
          };
        }));
      }

      case 'programs': {
        const recs = await fetchAll(BASE_L1, 'tbl44sPmN40FXJ6Nm',
          ['Program Name', 'Status', 'Enterprise Priority', 'Executive Sponsor']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Program Name'] ?? '',
            status: sel(f['Status']),
            priority: sel(f['Enterprise Priority']),
            sponsor: f['Executive Sponsor'] ?? '',
          };
        }));
      }

      case 'msc': {
        const recs = await fetchAll(BASE_L1, 'tbl0z89Mlv0BEKSnU',
          ['Capability Name', 'Status', 'Source Org', 'Product Lifecycle Stage', 'Size']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Capability Name'] ?? '',
            status: sel(f['Status']),
            org: f['Source Org'] ?? '',
            stage: sel(f['Product Lifecycle Stage']),
            size: sel(f['Size']),
          };
        }));
      }

      case 'beacon-epics': {
        const recs = await fetchAll(BASE_BEACON, 'tblcJntdnyFbpU0mh',
          ['Epic Name', 'Status', 'Priority', 'Assignee', 'Jira Key', 'Target Date']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Epic Name'] ?? '',
            status: sel(f['Status']),
            priority: sel(f['Priority']),
            assignee: f['Assignee'] ?? '',
            jiraKey: f['Jira Key'] ?? '',
            targetDate: f['Target Date'] ?? '',
          };
        }));
      }

      case 'lighthouse-actions': {
        const recs = await fetchAll(BASE_LIGHTHOUSE, 'tblASLUQOWprw6YgF',
          ['Action Name', 'Status', 'Owner', 'Due Date', 'Priority']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Action Name'] ?? '',
            status: sel(f['Status']),
            owner: f['Owner'] ?? '',
            dueDate: f['Due Date'] ?? '',
            priority: sel(f['Priority']),
          };
        }));
      }

      case 'deps': {
        const recs = await fetchAll(BASE_SWITCHBOARD, 'tblEEq5HGYSbi87W1',
          ['Dependency Name', 'Requesting Org', 'Resolving Org', 'Priority', 'Lifecycle', 'Target Resolution Date']);
        return Response.json(recs.map(r => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            name: f['Dependency Name'] ?? '',
            requestingOrg: f['Requesting Org'] ?? '',
            resolvingOrg: f['Resolving Org'] ?? '',
            priority: sel(f['Priority']),
            lifecycle: sel(f['Lifecycle']),
            targetDate: f['Target Resolution Date'] ?? '',
          };
        }));
      }

      default:
        return Response.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
