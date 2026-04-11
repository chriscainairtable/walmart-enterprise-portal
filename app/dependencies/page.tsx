'use client';
import { useEffect, useState, useMemo } from 'react';

const C = {
  deep: '#0B2C5F', blue: '#0071CE', yellow: '#FFC220',
  green: '#16a34a', amber: '#d97706', red: '#dc2626',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB', muted: '#64748B', text: '#1E293B',
  beacon: '#0891b2', lighthouse: '#7c3aed', switchboard: '#d97706',
};

const LIFECYCLE_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Declared':    { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  'Routed':      { bg: '#ede9fe', fg: '#6d28d9', dot: '#8b5cf6' },
  'Acknowledged':{ bg: '#eff6ff', fg: '#1d4ed8', dot: '#60a5fa' },
  'In Progress': { bg: '#fff7ed', fg: '#c2410c', dot: '#f97316' },
  'Resolved':    { bg: '#dcfce7', fg: '#16a34a', dot: '#22c55e' },
  'Confirmed':   { bg: '#dbeafe', fg: '#1d4ed8', dot: '#3b82f6' },
  'Identified':  { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  'In Discussion':{ bg: '#fef9c3', fg: '#a16207', dot: '#eab308' },
  'Accepted Risk':{ bg: '#fee2e2', fg: '#dc2626', dot: '#ef4444' },
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: C.red, High: C.amber, Medium: '#0891b2', Low: '#64748b',
};

type Dep = {
  id: string; name: string; requestingOrg: string; resolvingOrg: string;
  priority: string; lifecycle: string; requestDate: string | null;
  targetDate: string | null; description: string; resolutionNotes: string;
  requestingCapability: string; resolvingCapability: string; source: string;
};

type DepsData = {
  switchboard: Dep[];
  beaconLocal: Dep[];
  lighthouseLocal: Dep[];
};

function Badge({ label, colors }: { label: string; colors: { bg: string; fg: string; dot: string } }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: colors.bg, color: colors.fg, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LIFECYCLE_ORDER = ['Declared', 'Routed', 'Acknowledged', 'In Progress', 'Resolved', 'Confirmed'];

export default function DependencyPage() {
  const [data, setData] = useState<DepsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dep | null>(null);
  const [filterLifecycle, setFilterLifecycle] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterReqOrg, setFilterReqOrg] = useState('');

  useEffect(() => {
    fetch('/api/dependencies').then(r => r.json()).then((d: DepsData) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allDeps = useMemo(() => {
    if (!data) return [];
    return [...data.switchboard, ...data.beaconLocal, ...data.lighthouseLocal];
  }, [data]);

  const filtered = useMemo(() => allDeps.filter(d => {
    if (filterLifecycle && d.lifecycle !== filterLifecycle) return false;
    if (filterPriority && d.priority !== filterPriority) return false;
    if (filterReqOrg && d.requestingOrg !== filterReqOrg) return false;
    return true;
  }), [allDeps, filterLifecycle, filterPriority, filterReqOrg]);

  const reqOrgs = useMemo(() => [...new Set(allDeps.map(d => d.requestingOrg).filter(Boolean))].sort(), [allDeps]);
  const priorities = useMemo(() => [...new Set(allDeps.map(d => d.priority).filter(Boolean))], [allDeps]);

  const lifecycleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LIFECYCLE_ORDER.forEach(l => { counts[l] = 0; });
    filtered.forEach(d => { if (counts[d.lifecycle] !== undefined) counts[d.lifecycle]++; });
    return counts;
  }, [filtered]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: C.muted }}>
      Loading dependencies…
    </div>
  );

  const switchDeps = filtered.filter(d => d.source === 'Switchboard');
  // Group Switchboard deps by org pair for the visual map
  const flowGroups: Record<string, Dep[]> = {};
  switchDeps.forEach(d => {
    const key = `${d.requestingOrg}→${d.resolvingOrg}`;
    if (!flowGroups[key]) flowGroups[key] = [];
    flowGroups[key].push(d);
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: C.deep }}>Cross-Org Dependency Map</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 8 }}>
          {[
            { label: 'Requesting Org', value: filterReqOrg, set: setFilterReqOrg, opts: reqOrgs },
            { label: 'Lifecycle', value: filterLifecycle, set: setFilterLifecycle, opts: LIFECYCLE_ORDER },
            { label: 'Priority', value: filterPriority, set: setFilterPriority, opts: priorities },
          ].map(({ label, value, set, opts }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
              <select value={value} onChange={e => set(e.target.value)} style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 6px', background: '#fff', color: C.text, cursor: 'pointer' }}>
                <option value="">All</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {(filterLifecycle || filterPriority || filterReqOrg) && (
            <button onClick={() => { setFilterLifecycle(''); setFilterPriority(''); setFilterReqOrg(''); }}
              style={{ fontSize: 11, color: C.blue, cursor: 'pointer', background: 'none', border: 'none' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Flow diagram */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 16 }}>
            Dependency flows — {filtered.length} total ({data?.switchboard.length || 0} in Switchboard)
          </div>
          <FlowDiagram deps={switchDeps} onSelect={setSelected} selected={selected} />
        </div>

        {/* Lifecycle strip */}
        <div style={{ display: 'flex', gap: 10 }}>
          {LIFECYCLE_ORDER.map(lc => {
            const colors = LIFECYCLE_COLORS[lc] || { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
            const count = lifecycleCounts[lc] || 0;
            const isActive = filterLifecycle === lc;
            return (
              <div key={lc} onClick={() => setFilterLifecycle(isActive ? '' : lc)}
                style={{
                  flex: 1, background: isActive ? colors.fg : C.card,
                  border: `1px solid ${isActive ? colors.fg : C.border}`,
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'center',
                }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: isActive ? '#fff' : C.text }}>{count}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.8)' : C.muted, marginTop: 2 }}>{lc}</div>
              </div>
            );
          })}
        </div>

        {/* Table + Detail */}
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 300 }}>
          <div style={{ flex: 1, overflow: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  {['Dependency', 'From', 'To', 'Priority', 'Lifecycle', 'Target Date', 'Source'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(dep => {
                  const isSelected = selected?.id === dep.id;
                  const lc = LIFECYCLE_COLORS[dep.lifecycle] || { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
                  return (
                    <tr key={dep.id} onClick={() => setSelected(isSelected ? null : dep)}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: isSelected ? '#EFF6FF' : '#fff' }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500, maxWidth: 260 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.name}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <OrgBadge org={dep.requestingOrg} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <OrgBadge org={dep.resolvingOrg} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {dep.priority && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[dep.priority] || C.muted }}>{dep.priority}</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge label={dep.lifecycle} colors={lc} />
                      </td>
                      <td style={{ padding: '8px 12px', color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(dep.targetDate)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, background: '#f1f5f9', color: C.muted, padding: '2px 6px', borderRadius: 4 }}>{dep.source}</span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No dependencies match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 300, overflow: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, flexShrink: 0, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, flex: 1, marginRight: 8, lineHeight: 1.3 }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={selected.lifecycle} colors={LIFECYCLE_COLORS[selected.lifecycle] || { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' }} />
                {selected.priority && <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[selected.priority], padding: '2px 8px', background: '#f8fafc', borderRadius: 9999 }}>{selected.priority}</span>}
              </div>

              {selected.description && (
                <p style={{ marginTop: 12, fontSize: 12, color: C.text, lineHeight: 1.6, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>{selected.description}</p>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.beacon, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Requesting</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>Org</span>
                  <OrgBadge org={selected.requestingOrg} />
                </div>
                {selected.requestingCapability && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: C.muted, fontSize: 12 }}>Capability</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text, textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.requestingCapability}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>Requested</span>
                  <span style={{ fontSize: 12, color: C.text }}>{fmtDate(selected.requestDate)}</span>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.lighthouse, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Resolution</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>Org</span>
                  <OrgBadge org={selected.resolvingOrg} />
                </div>
                {selected.resolvingCapability && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: C.muted, fontSize: 12 }}>Capability</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text, textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.resolvingCapability}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>Target</span>
                  <span style={{ fontSize: 12, color: C.text }}>{fmtDate(selected.targetDate)}</span>
                </div>
                {selected.resolutionNotes && (
                  <p style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{selected.resolutionNotes}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Org flow visual ───────────────────────────────────────────────────────────
function OrgBadge({ org }: { org: string }) {
  const colors: Record<string, string> = { Beacon: C.beacon, Lighthouse: '#7c3aed', 'Supply Chain': C.green, HR: C.amber, Marketing: C.red };
  const color = colors[org] || C.muted;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>
      {org}
    </span>
  );
}

const ORG_COLORS: Record<string, string> = {
  Beacon: C.beacon, Lighthouse: '#7c3aed', 'Supply Chain': C.green, HR: C.amber, Marketing: C.red,
};

function FlowDiagram({ deps, onSelect, selected }: { deps: Dep[]; onSelect: (d: Dep) => void; selected: Dep | null }) {
  if (deps.length === 0) {
    return <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>No dependencies match the current filters.</div>;
  }

  // Gather unique orgs
  const orgs = [...new Set([...deps.map(d => d.requestingOrg), ...deps.map(d => d.resolvingOrg)].filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Org header row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {orgs.map(org => {
          const color = ORG_COLORS[org] || C.muted;
          const orgDepCount = deps.filter(d => d.requestingOrg === org || d.resolvingOrg === org).length;
          return (
            <div key={org} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `${color}12`, border: `1px solid ${color}30`,
              borderRadius: 8, padding: '8px 14px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{org}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{orgDepCount} dep{orgDepCount !== 1 ? 's' : ''}</span>
            </div>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.switchboard, fontWeight: 600 }}>
          <span style={{ fontSize: 14 }}>⟳</span> routed via L3 Switchboard
        </div>
      </div>

      {/* Dependency lanes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deps.map(dep => {
          const isSelected = selected?.id === dep.id;
          const lc = LIFECYCLE_COLORS[dep.lifecycle] || { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
          const reqColor = ORG_COLORS[dep.requestingOrg] || C.muted;
          const resColor = ORG_COLORS[dep.resolvingOrg] || C.muted;
          const priorityColor = PRIORITY_COLORS[dep.priority] || C.muted;
          const isCritical = dep.priority === 'Critical';

          return (
            <div
              key={dep.id}
              onClick={() => onSelect(dep)}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 140px',
                alignItems: 'center',
                gap: 0,
                background: isSelected ? '#eff6ff' : isCritical ? '#fff5f5' : '#fafafa',
                border: `1px solid ${isSelected ? C.blue : isCritical ? '#fecaca' : C.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
                overflow: 'hidden',
              }}
            >
              {/* Requesting org */}
              <div style={{
                padding: '10px 14px',
                background: `${reqColor}10`,
                borderRight: `2px solid ${reqColor}30`,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: reqColor }}>{dep.requestingOrg}</span>
                <span style={{ fontSize: 10, color: C.muted }}>requesting</span>
              </div>

              {/* Center: name + badges + arrow */}
              <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isCritical && <span style={{ fontSize: 10, color: C.red }}>⚠</span>}
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dep.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Arrow showing direction */}
                  <span style={{ fontSize: 11, color: reqColor }}>→</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    background: lc.bg, color: lc.fg,
                    padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: lc.dot }} />
                    {dep.lifecycle}
                  </span>
                  {dep.priority && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor }}>{dep.priority}</span>
                  )}
                  {dep.targetDate && (
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>
                      {new Date(dep.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Resolving org */}
              <div style={{
                padding: '10px 14px',
                background: `${resColor}10`,
                borderLeft: `2px solid ${resColor}30`,
                display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: resColor }}>{dep.resolvingOrg}</span>
                <span style={{ fontSize: 10, color: C.muted }}>resolving</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
