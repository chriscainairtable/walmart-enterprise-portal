'use client';
import { useEffect, useState, useMemo } from 'react';

const C = {
  deep: '#0B2C5F', blue: '#0071CE', yellow: '#FFC220',
  green: '#16a34a', amber: '#d97706', red: '#dc2626', purple: '#7c3aed', teal: '#0891b2',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB', muted: '#64748B', text: '#1E293B',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'On Track':    { bg: '#dcfce7', fg: '#16a34a', dot: '#22c55e' },
  'At Risk':     { bg: '#fef9c3', fg: '#a16207', dot: '#eab308' },
  'Off Track':   { bg: '#fee2e2', fg: '#dc2626', dot: '#ef4444' },
  'Complete':    { bg: '#dbeafe', fg: '#1d4ed8', dot: '#3b82f6' },
  'Approved':    { bg: '#f3e8ff', fg: '#7c3aed', dot: '#a855f7' },
  'In Progress': { bg: '#fff7ed', fg: '#c2410c', dot: '#f97316' },
  'In Flight':   { bg: '#fff7ed', fg: '#c2410c', dot: '#f97316' },
  'Not Started': { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  'Paused':      { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  'Draft':       { bg: '#f8fafc', fg: '#64748b', dot: '#cbd5e1' },
};

type Cap = { id: string; name: string; status: string; sourceOrg: string; lifecycleStage: string; primaryProduct: string };
type Initiative = {
  id: string; name: string; status: string; sourceOrg: string; pillar: string;
  priority: string; atlBtl: string; enterprisePriority: string;
  projectedStart: string | null; projectedEnd: string | null;
  annualRevenue: number; costSavings: number; investment: number; roi: number;
  health: string; capabilityCount: number;
  productLead: string; engineeringLead: string; financeLead: string; tpm: string;
  dateToGreen: string | null; planToGreen: string;
  capabilities: Cap[];
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.fg, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status || '—'}
    </span>
  );
}

function fmt$(n: number) {
  if (!n) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}
function fmtPct(n: number) {
  if (!n) return '—';
  return n <= 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}x`;
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [sortField, setSortField] = useState<keyof Initiative>('annualRevenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/initiatives').then(r => r.json()).then((d: Initiative[]) => {
      setInitiatives(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const orgs = useMemo(() => [...new Set(initiatives.map(i => i.sourceOrg).filter(Boolean))].sort(), [initiatives]);
  const statuses = useMemo(() => [...new Set(initiatives.map(i => i.status).filter(Boolean))].sort(), [initiatives]);
  const pillars = useMemo(() => [...new Set(initiatives.map(i => i.pillar).filter(Boolean))].sort(), [initiatives]);

  const filtered = useMemo(() => initiatives.filter(i => {
    if (filterOrg && i.sourceOrg !== filterOrg) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterPillar && i.pillar !== filterPillar) return false;
    return true;
  }), [initiatives, filterOrg, filterStatus, filterPillar]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortField] as string | number ?? '';
    const bv = b[sortField] as string | number ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [filtered, sortField, sortAsc]);

  // KPIs
  const total = filtered.length;
  const onTrack = filtered.filter(i => i.status === 'On Track').length;
  const atRisk = filtered.filter(i => i.status === 'At Risk').length;
  const offTrack = filtered.filter(i => i.status === 'Off Track').length;
  const totalRev = filtered.reduce((s, i) => s + (i.annualRevenue || 0), 0);
  const totalInv = filtered.reduce((s, i) => s + (i.investment || 0), 0);

  const toggleSort = (f: keyof Initiative) => {
    if (sortField === f) setSortAsc(a => !a);
    else { setSortField(f); setSortAsc(false); }
  };

  const TH = ({ label, field }: { label: string; field?: keyof Initiative }) => (
    <th onClick={() => field && toggleSort(field)} style={{
      padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted,
      whiteSpace: 'nowrap', cursor: field ? 'pointer' : 'default', userSelect: 'none',
      background: '#F8FAFC', borderBottom: `1px solid ${C.border}`,
    }}>
      {label}{field && sortField === field ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </th>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: C.muted }}>
      Loading initiatives…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: C.deep }}>Initiative Portfolio</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 8 }}>
          {[
            { label: 'Source Org', value: filterOrg, set: setFilterOrg, opts: orgs },
            { label: 'Status', value: filterStatus, set: setFilterStatus, opts: statuses },
            { label: 'Pillar', value: filterPillar, set: setFilterPillar, opts: pillars },
          ].map(({ label, value, set, opts }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
              <select value={value} onChange={e => set(e.target.value)} style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 6px', background: '#fff', color: C.text, cursor: 'pointer' }}>
                <option value="">All</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {(filterOrg || filterStatus || filterPillar) && (
            <button onClick={() => { setFilterOrg(''); setFilterStatus(''); setFilterPillar(''); }}
              style={{ fontSize: 11, color: C.blue, cursor: 'pointer', background: 'none', border: 'none' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 24px', flexShrink: 0 }}>
        {[
          { label: 'Total Initiatives', value: total, color: C.text },
          { label: 'On Track', value: `${onTrack} (${total ? Math.round(onTrack/total*100) : 0}%)`, color: C.green },
          { label: 'At Risk', value: `${atRisk} (${total ? Math.round(atRisk/total*100) : 0}%)`, color: C.amber },
          { label: 'Off Track', value: `${offTrack} (${total ? Math.round(offTrack/total*100) : 0}%)`, color: C.red },
          { label: 'Total Revenue', value: fmt$(totalRev), color: C.green },
          { label: 'Total Investment', value: fmt$(totalInv), color: C.blue },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table + Detail */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: '0 24px 24px', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <TH label="Initiative" field="name" />
                <TH label="Status" field="status" />
                <TH label="Source Org" field="sourceOrg" />
                <TH label="Pillar" field="pillar" />
                <TH label="Priority" field="priority" />
                <TH label="Caps" field="capabilityCount" />
                <TH label="Annual Revenue" field="annualRevenue" />
                <TH label="Investment" field="investment" />
                <TH label="ROI" field="roi" />
                <TH label="Start" field="projectedStart" />
                <TH label="End" field="projectedEnd" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(i => {
                const isSelected = selected?.id === i.id;
                const atRiskOrOff = i.status === 'At Risk' || i.status === 'Off Track';
                return (
                  <tr key={i.id} onClick={() => setSelected(isSelected ? null : i)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: isSelected ? '#EFF6FF' : atRiskOrOff ? '#fffbeb' : '#fff' }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = atRiskOrOff ? '#fffbeb' : '#fff'; }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, maxWidth: 240 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name || <span style={{ color: C.muted, fontStyle: 'italic' }}>Unnamed initiative</span>}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}><StatusBadge status={i.status} /></td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{i.sourceOrg}</td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap', maxWidth: 120 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.pillar}</div>
                    </td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{i.priority?.replace('P1 — ', 'P1 ').replace('P2 — ', 'P2 ').replace('P3 — ', 'P3 ')}</td>
                    <td style={{ padding: '8px 12px', color: i.capabilityCount > 0 ? C.blue : C.muted, fontWeight: i.capabilityCount > 0 ? 600 : 400, textAlign: 'center' }}>{i.capabilityCount || '—'}</td>
                    <td style={{ padding: '8px 12px', color: C.green, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt$(i.annualRevenue)}</td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{fmt$(i.investment)}</td>
                    <td style={{ padding: '8px 12px', color: C.purple, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtPct(i.roi)}</td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(i.projectedStart)}</td>
                    <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(i.projectedEnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 340, overflow: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, flexShrink: 0, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8, lineHeight: 1.3 }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
            </div>
            <StatusBadge status={selected.status} />

            <Section title="Overview">
              <Row label="Source Org" value={selected.sourceOrg} />
              <Row label="Pillar" value={selected.pillar} />
              <Row label="Priority" value={selected.priority} />
              <Row label="ATL/BTL" value={selected.atlBtl} />
              <Row label="Enterprise Priority" value={selected.enterprisePriority} />
              <Row label="Product Lead" value={selected.productLead} />
              <Row label="Eng Lead" value={selected.engineeringLead} />
              <Row label="Finance Lead" value={selected.financeLead} />
              <Row label="TPM" value={selected.tpm} />
              <Row label="Start" value={fmtDate(selected.projectedStart)} />
              <Row label="End" value={fmtDate(selected.projectedEnd)} />
            </Section>

            <Section title="Financials" accent={C.green}>
              <Row label="Annual Revenue" value={fmt$(selected.annualRevenue)} color={C.green} />
              <Row label="Cost Savings" value={fmt$(selected.costSavings)} color={C.teal} />
              <Row label="Investment" value={fmt$(selected.investment)} />
              <Row label="Projected ROI" value={fmtPct(selected.roi)} color={C.purple} />
            </Section>

            {(selected.status === 'At Risk' || selected.status === 'Off Track') && (selected.planToGreen || selected.dateToGreen) && (
              <Section title="Plan to Green" accent={C.amber}>
                <Row label="Date to Green" value={fmtDate(selected.dateToGreen)} />
                {selected.planToGreen && <p style={{ fontSize: 12, color: C.text, marginTop: 6, lineHeight: 1.6 }}>{selected.planToGreen}</p>}
              </Section>
            )}

            {selected.capabilities.length > 0 && (
              <Section title={`Capabilities (${selected.capabilities.length})`} accent={C.blue}>
                {selected.capabilities.map(cap => (
                  <div key={cap.id} style={{ padding: '5px 0', borderBottom: `1px solid #f1f5f9` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cap.name}</span>
                      <StatusBadge status={cap.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      {cap.sourceOrg && <span style={{ fontSize: 10, color: C.muted, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{cap.sourceOrg}</span>}
                      {cap.lifecycleStage && <span style={{ fontSize: 10, color: C.muted }}>{cap.lifecycleStage}</span>}
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: accent || C.blue, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  if (!value || value === '—') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f8fafc', gap: 8 }}>
      <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: color || C.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{value}</span>
    </div>
  );
}
