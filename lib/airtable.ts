const PAT = process.env.AIRTABLE_PAT!;

const BASE_L1          = 'appCNBYNGcbSj7fNq';
const BASE_BEACON      = 'appwkie9ju54wkfYT';
const BASE_LIGHTHOUSE  = 'appy9LBctWK5O1lEb';
const BASE_SWITCHBOARD = 'appEYNscRBWFAlGsT';
const BASE_ORCHESTRATOR = 'appbcfht8yKGA4uQk';

export { BASE_L1, BASE_BEACON, BASE_LIGHTHOUSE, BASE_SWITCHBOARD, BASE_ORCHESTRATOR };

// Airtable deep-link (demo org)
export function atLink(baseId: string, tableId?: string, recordId?: string) {
  let url = `https://airtabledemo.com/${baseId}`;
  if (tableId) url += `/${tableId}`;
  if (recordId) url += `/${recordId}`;
  return url;
}

async function fetchAll(baseId: string, tableId: string, fields: string[], filter?: string) {
  const records: Record<string, unknown>[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    fields.forEach(f => params.append('fields[]', f));
    if (filter) params.set('filterByFormula', filter);
    if (offset) params.set('offset', offset);
    params.set('pageSize', '100');
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}?${params}`,
      { headers: { Authorization: `Bearer ${PAT}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

async function countTable(baseId: string, tableId: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=1`,
      { headers: { Authorization: `Bearer ${PAT}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return 0;
    // Airtable doesn't expose total count — fetch with pagination to count
    const records = await fetchAll(baseId, tableId, ['Name']);
    return records.length;
  } catch { return 0; }
}

// ── META ────────────────────────────────────────────────────────────────────
export async function fetchMeta() {
  const [initCount, progCount, wsCount, mscCount, beaconCapCount, beaconEpicCount,
         lighthouseCapCount, lighthouseActCount, switchDepCount] = await Promise.all([
    countTable(BASE_L1, 'tbl2ExbwxFOFpEtom'),
    countTable(BASE_L1, 'tbl44sPmN40FXJ6Nm'),
    countTable(BASE_L1, 'tblipY4uAz8XwtgBu'),
    countTable(BASE_L1, 'tbl0z89Mlv0BEKSnU'),
    countTable(BASE_BEACON, 'tbl0SrUcmmHaLAoja'),
    countTable(BASE_BEACON, 'tblcJntdnyFbpU0mh'),
    countTable(BASE_LIGHTHOUSE, 'tblArf28zLJygHiR2'),
    countTable(BASE_LIGHTHOUSE, 'tblASLUQOWprw6YgF'),
    countTable(BASE_SWITCHBOARD, 'tblEEq5HGYSbi87W1'),
  ]);
  return {
    l1: { initiatives: initCount, programs: progCount, workstreams: wsCount, mscCapabilities: mscCount },
    beacon: { capabilities: beaconCapCount, jiraEpics: beaconEpicCount },
    lighthouse: { capabilities: lighthouseCapCount, actions: lighthouseActCount },
    switchboard: { crossOrgDeps: switchDepCount },
    orchestrator: { note: 'Coordination layer — no extension needed' },
  };
}

// ── INITIATIVES ─────────────────────────────────────────────────────────────
export async function fetchInitiatives() {
  const records = await fetchAll(BASE_L1, 'tbl2ExbwxFOFpEtom', [
    'Name', 'Status', 'Source Org', 'Pillar', 'Priority', 'ATL/BTL',
    'Enterprise Priorities', 'Projected Start', 'Projected End',
    'Annual Revenue Impact', 'Annual Cost Savings', 'Investment Required',
    'Projected ROI', 'Health', 'Capability Count',
    'On Track Count', 'At Risk Count', 'Off Track Count', 'Complete Count',
    'Product Lead', 'Engineering Lead', 'Finance Lead(s)', 'TPM/Program',
    'Date to Green', 'Plan to Green', 'Multi Source Capabilities',
  ]);
  return records.map(r => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id as string,
      name: (f['Name'] as string) || '',
      status: selectName(f['Status']),
      sourceOrg: (f['Source Org'] as string) || '',
      pillar: selectName(f['Pillar']),
      priority: selectName(f['Priority']),
      atlBtl: selectName(f['ATL/BTL']),
      enterprisePriority: selectName(f['Enterprise Priorities']),
      projectedStart: (f['Projected Start'] as string) || null,
      projectedEnd: (f['Projected End'] as string) || null,
      annualRevenue: (f['Annual Revenue Impact'] as number) || 0,
      costSavings: (f['Annual Cost Savings'] as number) || 0,
      investment: (f['Investment Required'] as number) || 0,
      roi: (f['Projected ROI'] as number) || 0,
      health: (f['Health'] as string) || '',
      capabilityCount: (f['Capability Count'] as number) || 0,
      productLead: (f['Product Lead'] as string) || '',
      engineeringLead: (f['Engineering Lead'] as string) || '',
      financeLead: (f['Finance Lead(s)'] as string) || '',
      tpm: (f['TPM/Program'] as string) || '',
      dateToGreen: (f['Date to Green'] as string) || null,
      planToGreen: (f['Plan to Green'] as string) || '',
      mscLinks: (f['Multi Source Capabilities'] as Array<{id: string; name: string}>) || [],
    };
  });
}

// ── MSC CAPABILITIES ────────────────────────────────────────────────────────
export async function fetchMSC() {
  const records = await fetchAll(BASE_L1, 'tbl0z89Mlv0BEKSnU', [
    'Capability Name', 'Status', 'Source Org', 'Initiative Name (from L2)',
    'Primary Product', 'Product Lifecycle Stage', 'Engineering Lead', 'Size',
    'Initiative (L1 Link)',
  ]);
  return records.map(r => {
    const f = r.fields as Record<string, unknown>;
    const initLinks = (f['Initiative (L1 Link)'] as Array<{id: string; name: string}>) || [];
    return {
      id: r.id as string,
      name: (f['Capability Name'] as string) || '',
      status: selectName(f['Status']),
      sourceOrg: (f['Source Org'] as string) || '',
      initiativeNameText: (f['Initiative Name (from L2)'] as string) || '',
      initiativeIds: initLinks.map(l => l.id),
      primaryProduct: (f['Primary Product'] as string) || '',
      lifecycleStage: selectName(f['Product Lifecycle Stage']),
      engineeringLead: (f['Engineering Lead'] as string) || '',
      size: selectName(f['Size']),
    };
  });
}

// ── CROSS-ORG DEPENDENCIES ───────────────────────────────────────────────────
export async function fetchCrossOrgDeps() {
  const [switchDeps, beaconLocalDeps, lighthouseLocalDeps] = await Promise.all([
    fetchAll(BASE_SWITCHBOARD, 'tblEEq5HGYSbi87W1', [
      'Dependency Name', 'Requesting Org', 'Resolving Org', 'Priority',
      'Lifecycle', 'Request Date', 'Target Resolution Date', 'Description',
      'Resolution Notes', 'Requesting Capability', 'Resolving Capability',
    ]),
    fetchAll(BASE_BEACON, 'tbluNhcpHqOm6UVAF', [
      'Dependency Name', 'Dependency Type', 'Lifecycle', 'Description',
      'Flag as Cross-Org', 'Resolving Org',
    ]),
    fetchAll(BASE_LIGHTHOUSE, 'tbl5COcAiS9xh0el1', [
      'Dependency Name', 'Dependency Type', 'Lifecycle', 'Description',
      'Flag as Cross-Org', 'Resolving Org',
    ]),
  ]);

  const mapDep = (r: Record<string, unknown>, source: string) => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id as string,
      name: (f['Dependency Name'] as string) || '',
      requestingOrg: (f['Requesting Org'] as string) || source,
      resolvingOrg: selectName(f['Resolving Org']),
      priority: selectName(f['Priority']),
      lifecycle: selectName(f['Lifecycle']),
      requestDate: (f['Request Date'] as string) || null,
      targetDate: (f['Target Resolution Date'] as string) || null,
      description: (f['Description'] as string) || '',
      resolutionNotes: (f['Resolution Notes'] as string) || '',
      requestingCapability: (f['Requesting Capability'] as string) || '',
      resolvingCapability: (f['Resolving Capability'] as string) || '',
      source,
    };
  };

  return {
    switchboard: switchDeps.map(r => mapDep(r, 'Switchboard')),
    beaconLocal: beaconLocalDeps
      .filter(r => (r.fields as Record<string, unknown>)['Flag as Cross-Org'])
      .map(r => mapDep(r, 'Beacon')),
    lighthouseLocal: lighthouseLocalDeps
      .filter(r => (r.fields as Record<string, unknown>)['Flag as Cross-Org'])
      .map(r => mapDep(r, 'Lighthouse')),
  };
}

function selectName(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'object' && val !== null && 'name' in val) return (val as {name: string}).name;
  return String(val);
}
