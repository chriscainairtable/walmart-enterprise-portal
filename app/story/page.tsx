'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { STEPS, NodeId, SyncId } from '@/lib/storySteps';

const C = {
  deep: '#0B2C5F', blue: '#0071CE', yellow: '#FFC220',
  green: '#16a34a', amber: '#d97706', red: '#dc2626',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB', muted: '#64748B',
  nodeBeacon: '#0891b2', nodeLighthouse: '#7c3aed', nodeSwitch: '#d97706', nodeOrch: '#475569',
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function selectName(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'object' && v !== null && 'name' in v) return (v as { name: string }).name;
  return String(v);
}

// ── Architecture Map ─────────────────────────────────────────────────────────
const NODE_COLOR: Record<NodeId, string> = {
  l1: C.blue, beacon: C.nodeBeacon, lighthouse: C.nodeLighthouse,
  orchestrator: C.nodeOrch, switchboard: C.nodeSwitch,
};

type NodeDef = { id: NodeId; x: number; y: number; w: number; h: number; label: string };
const MAP_W = 580, MAP_H = 210;
const NODES: NodeDef[] = [
  { id: 'l1',           x: 90,  y: 10,  w: 400, h: 52, label: 'L1  Strategic Portfolio' },
  { id: 'beacon',       x: 10,  y: 100, w: 155, h: 52, label: 'Beacon Shell' },
  { id: 'orchestrator', x: 212, y: 100, w: 155, h: 52, label: 'Orchestrator' },
  { id: 'lighthouse',   x: 414, y: 100, w: 155, h: 52, label: 'Lighthouse' },
  { id: 'switchboard',  x: 90,  y: 155, w: 400, h: 52, label: 'L3  Switchboard' },
];
const SYNCS: { id: SyncId; from: NodeId; to: NodeId; color: string; dash: boolean }[] = [
  { id: 'beacon-l1',           from: 'beacon',       to: 'l1',          color: C.blue,    dash: false },
  { id: 'lighthouse-l1',       from: 'lighthouse',   to: 'l1',          color: C.blue,    dash: false },
  { id: 'beacon-switchboard',  from: 'beacon',       to: 'switchboard', color: C.amber,   dash: true  },
  { id: 'lighthouse-switchboard', from: 'lighthouse', to: 'switchboard', color: C.amber,  dash: true  },
  { id: 'orchestrator-l1',     from: 'orchestrator', to: 'l1',          color: '#94a3b8', dash: true  },
  { id: 'orchestrator-switchboard', from: 'orchestrator', to: 'switchboard', color: '#94a3b8', dash: true },
];

function ArchMap({ highlightNodes, highlightSyncs }: { highlightNodes: NodeId[]; highlightSyncs: SyncId[] }) {
  const nodeMap = new Map(NODES.map(n => [n.id, n]));
  const cx = (n: NodeDef) => n.x + n.w / 2;
  const cy = (n: NodeDef) => n.y + n.h / 2;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes marchingAnts {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
        .sync-animated { animation: marchingAnts 0.7s linear infinite; }
      `}</style>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: '100%' }}>
        <defs>
          {(['blue','amber','slate'] as const).map((name, i) => {
            const colors = [C.blue, C.amber, '#94a3b8'];
            return (
              <marker key={name} id={`sm-arrow-${name}`} markerWidth={7} markerHeight={7} refX={5} refY={3} orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill={colors[i]} />
              </marker>
            );
          })}
          {NODES.map(n => (
            <filter key={`glow-${n.id}`} id={`glow-${n.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {/* Layer labels */}
        <text x={6} y={42}  fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L1</text>
        <text x={6} y={132} fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L2</text>
        <text x={6} y={185} fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L3</text>

        {/* Sync arrows */}
        {SYNCS.map(sync => {
          const from = nodeMap.get(sync.from)!;
          const to   = nodeMap.get(sync.to)!;
          const isHighlighted = highlightSyncs.includes(sync.id);
          const fx = cx(from);
          const fy = from.y < to.y ? from.y + from.h : from.y;
          const tx = cx(to);
          const ty = to.y < from.y ? to.y + to.h : to.y;
          const markerName = sync.color === C.blue ? 'blue' : sync.color === C.amber ? 'amber' : 'slate';
          return (
            <line key={sync.id}
              x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={sync.color}
              strokeWidth={isHighlighted ? 2.5 : 1}
              strokeDasharray={sync.dash || isHighlighted ? '6 4' : undefined}
              markerEnd={`url(#sm-arrow-${markerName})`}
              opacity={isHighlighted ? 1 : 0.25}
              className={isHighlighted ? 'sync-animated' : undefined}
              style={isHighlighted ? { strokeDasharray: '6 4' } : undefined}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const isHL = highlightNodes.includes(n.id);
          const color = NODE_COLOR[n.id];
          return (
            <g key={n.id}>
              <rect
                x={n.x} y={n.y} width={n.w} height={n.h} rx={7}
                fill={isHL ? color : '#fff'}
                stroke={isHL ? color : '#e2e8f0'}
                strokeWidth={isHL ? 2 : 1}
                filter={isHL ? `url(#glow-${n.id})` : undefined}
                opacity={isHL ? 1 : 0.5}
              />
              <text x={cx(n)} y={n.y + 22} textAnchor="middle"
                fontSize={11} fontWeight={700} fill={isHL ? '#fff' : '#94a3b8'}>
                {n.label}
              </text>
              <text x={cx(n)} y={n.y + 37} textAnchor="middle"
                fontSize={9} fill={isHL ? 'rgba(255,255,255,0.75)' : '#cbd5e1'}>
                {n.id === 'l1' ? 'Strategic Portfolio' :
                 n.id === 'beacon' ? 'Tech org · Jira-linked' :
                 n.id === 'lighthouse' ? 'Non-tech org · Finance/Strategy' :
                 n.id === 'orchestrator' ? 'Coordination layer' :
                 'Cross-org dependencies'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Status Colors ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'On Track': '#16a34a', 'Complete': '#1d4ed8', 'At Risk': '#d97706',
  'Off Track': '#dc2626', 'Blocked': '#dc2626', 'In Progress': '#c2410c',
  'In Flight': '#c2410c', 'Not Started': '#64748b', 'Paused': '#64748b',
  'Draft': '#94a3b8', 'Declared': '#64748b', 'Routed': '#6d28d9',
  'Acknowledged': '#1d4ed8', 'Resolved': '#16a34a', 'Confirmed': '#1d4ed8',
  'Approved': '#7c3aed', 'Cancelled': '#64748b', 'Archived': '#94a3b8',
};
const STATUS_BG: Record<string, string> = {
  'On Track': '#dcfce7', 'Complete': '#dbeafe', 'At Risk': '#fef9c3',
  'Off Track': '#fee2e2', 'Blocked': '#fee2e2', 'In Progress': '#fff7ed',
  'In Flight': '#fff7ed', 'Not Started': '#f1f5f9', 'Paused': '#f1f5f9',
  'Draft': '#f8fafc', 'Declared': '#f1f5f9', 'Routed': '#ede9fe',
  'Acknowledged': '#eff6ff', 'Resolved': '#dcfce7', 'Confirmed': '#dbeafe',
  'Approved': '#f3e8ff', 'Cancelled': '#f1f5f9', 'Archived': '#f1f5f9',
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  return (
    <span style={{
      background: STATUS_BG[status] || '#f1f5f9',
      color: STATUS_COLORS[status] || '#475569',
      borderRadius: 999, fontSize: 10, fontWeight: 700,
      padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>{status}</span>
  );
}

// ── Data Panels ───────────────────────────────────────────────────────────────
function SummaryPanel({ records, groupByField }: { records: AirtableRecord[]; groupByField?: string }) {
  const field = groupByField || 'Status';
  const counts: Record<string, number> = {};
  records.forEach(r => {
    const v = selectName(r.fields[field]) || 'Unknown';
    counts[v] = (counts[v] || 0) + 1;
  });
  const total = records.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // Check for financial fields
  const hasFinancials = records.some(r => r.fields['Annual Revenue Impact'] || r.fields['Investment Required']);
  const totalRevenue = records.reduce((s, r) => s + ((r.fields['Annual Revenue Impact'] as number) || 0), 0);
  const totalSavings = records.reduce((s, r) => s + ((r.fields['Annual Cost Savings'] as number) || 0), 0);
  const totalInvestment = records.reduce((s, r) => s + ((r.fields['Investment Required'] as number) || 0), 0);

  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hasFinancials && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Revenue Impact', value: fmt(totalRevenue), color: C.green },
            { label: 'Cost Savings', value: fmt(totalSavings), color: '#0891b2' },
            { label: 'Investment', value: fmt(totalInvestment), color: C.amber },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          {field} Distribution — {total} total
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.slice(0, 10).map(([label, count]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 90, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </div>
              <div style={{ flex: 1, height: 18, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${(count / total) * 100}%`, height: '100%',
                  background: STATUS_COLORS[label] || C.blue,
                  borderRadius: 4, transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ width: 32, fontSize: 11, fontWeight: 700, color: STATUS_COLORS[label] || C.blue, textAlign: 'right', flexShrink: 0 }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordsPanel({ records }: { records: AirtableRecord[] }) {
  const SKIP_FIELDS = new Set(['Name', 'Capability Name', 'Dependency Name', 'Status', 'Lifecycle', 'Priority']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {records.map(r => {
        const f = r.fields;
        const name = (f['Name'] || f['Capability Name'] || f['Dependency Name'] || f['Action Name'] || 'Untitled') as string;
        const status = selectName(f['Status'] || f['Lifecycle']);
        const meta: string[] = [];

        // Collect secondary fields
        const candidates = ['Pillar', 'Priority', 'Source Org', 'Product Lifecycle Stage', 'Engineering Lead', 'Product Lead', 'Owner', 'Requesting Org', 'Resolving Org', 'Primary Product', 'Size', 'ATL/BTL', 'Enterprise Priorities'];
        candidates.forEach(key => {
          if (!SKIP_FIELDS.has(key) && f[key]) {
            const val = selectName(f[key]);
            if (val) meta.push(val);
          }
        });

        // Financial fields
        if (f['Annual Revenue Impact']) meta.unshift(`Rev: $${((f['Annual Revenue Impact'] as number) / 1e6).toFixed(0)}M`);
        if (f['Investment Required']) meta.push(`Inv: $${((f['Investment Required'] as number) / 1e6).toFixed(0)}M`);
        if (f['Projected ROI']) meta.push(`ROI: ${f['Projected ROI']}%`);

        // Date to Green
        if (f['Date to Green']) meta.push(`→ Green: ${(f['Date to Green'] as string).slice(0, 10)}`);
        if (f['Target Resolution Date']) meta.push(`Target: ${(f['Target Resolution Date'] as string).slice(0, 10)}`);
        if (f['Due Date']) meta.push(`Due: ${(f['Due Date'] as string).slice(0, 10)}`);

        return (
          <div key={r.id} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{name}</span>
              {status && <StatusBadge status={status} />}
            </div>
            {meta.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {meta.slice(0, 5).map((m, i) => (
                  <span key={i} style={{ fontSize: 10, color: C.muted, background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: 4, padding: '1px 6px' }}>{m}</span>
                ))}
              </div>
            )}
            {!!f['Plan to Green'] && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 1.4, borderLeft: `2px solid ${C.amber}`, paddingLeft: 6 }}>
                {(f['Plan to Green'] as string).slice(0, 120)}{(f['Plan to Green'] as string).length > 120 ? '…' : ''}
              </div>
            )}
            {!!f['Description'] && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                {(f['Description'] as string).slice(0, 100)}{(f['Description'] as string).length > 100 ? '…' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelPanel({ records, groupByField }: { records: AirtableRecord[]; groupByField?: string }) {
  const field = groupByField || 'Lifecycle';
  const FUNNEL_ORDER = ['Declared', 'Routed', 'Acknowledged', 'In Progress', 'Resolved', 'Archived', 'Cancelled'];
  const counts: Record<string, number> = {};
  records.forEach(r => {
    const v = selectName(r.fields[field]) || 'Unknown';
    counts[v] = (counts[v] || 0) + 1;
  });

  const all = Object.entries(counts);
  const ordered = FUNNEL_ORDER.filter(s => counts[s]).map(s => [s, counts[s]] as [string, number]);
  const rest = all.filter(([s]) => !FUNNEL_ORDER.includes(s));
  const sorted = [...ordered, ...rest.sort((a, b) => b[1] - a[1])];
  const total = records.length;
  const max = Math.max(...sorted.map(([, c]) => c));

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {field} Funnel — {total} total dependencies
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(([label, count], i) => {
          const pct = max > 0 ? (count / max) * 100 : 0;
          const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0;
          const isActive = !['Resolved', 'Cancelled', 'Archived'].includes(label);
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#334155', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  {isActive && <span style={{ fontSize: 9, background: '#eff6ff', color: C.blue, borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>ACTIVE</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.muted }}>{pctOfTotal}%</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: STATUS_COLORS[label] || C.blue, width: 28, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
              <div style={{ height: 28, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: STATUS_COLORS[label] || C.blue,
                  borderRadius: 6,
                  opacity: isActive ? 1 : 0.4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Story Page ───────────────────────────────────────────────────────────
export default function StoryPage() {
  const router = useRouter();
  const [currentId, setCurrentId] = useState(1);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchController = useRef<AbortController | null>(null);

  const step = STEPS.find(s => s.id === currentId) || STEPS[0];

  const goTo = useCallback((id: number) => {
    const clamped = Math.max(1, Math.min(STEPS.length, id));
    setCurrentId(clamped);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentId + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentId - 1);
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentId, goTo, router]);

  // Fetch step data
  useEffect(() => {
    if (fetchController.current) fetchController.current.abort();
    const ctrl = new AbortController();
    fetchController.current = ctrl;

    setLoading(true);
    setError(null);
    setRecords([]);

    fetch(`/api/story/${step.id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return;
        setRecords((data.records || []) as AirtableRecord[]);
        if (data.error) setError(data.error);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError('Failed to load data');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [step.id]);

  const ACT_COLORS: Record<string, string> = {
    'Act I — Initiative Reporting': C.blue,
    'Act II — Capability Execution': C.nodeBeacon,
    'Act III — Cross-Org Dependencies': C.nodeSwitch,
    'Act IV — The Full System': C.deep,
  };
  const actColor = ACT_COLORS[step.act] || C.blue;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: C.deep, overflow: 'hidden' }}>

      {/* Top bar: progress + exit */}
      <div style={{
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', flexShrink: 0,
          }}
        >
          ← Exit
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          {STEPS.map(s => {
            const sActColor = ACT_COLORS[s.act] || C.blue;
            const isCurrent = s.id === currentId;
            const isPast = s.id < currentId;
            return (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                title={`${s.id}. ${s.title}`}
                style={{
                  width: isCurrent ? 28 : 10,
                  height: 10, borderRadius: 5, border: 'none', cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.25s ease',
                  background: isCurrent ? C.yellow : isPast ? `${sActColor}88` : 'rgba(255,255,255,0.2)',
                }}
              />
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
          {currentId} / {STEPS.length}
        </div>
      </div>

      {/* Architecture map — fixed height container prevents SVG from scaling to full viewport */}
      <div style={{
        background: '#0f1f3d', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 20px', flexShrink: 0, height: 160, overflow: 'hidden', boxSizing: 'border-box',
      }}>
        <div style={{ height: '100%', overflow: 'hidden' }}>
          <ArchMap highlightNodes={step.highlightNodes} highlightSyncs={step.highlightSyncs} />
        </div>
      </div>

      {/* Content row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: narrative */}
        <div style={{
          width: 340, flexShrink: 0, padding: '24px 24px 16px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto',
        }}>
          <div>
            <div style={{
              display: 'inline-block', background: `${actColor}22`, color: actColor,
              border: `1px solid ${actColor}44`, borderRadius: 999,
              fontSize: 10, fontWeight: 700, padding: '3px 10px', letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              {step.act}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {step.title}
            </h2>
          </div>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
            {step.narrative}
          </p>

          {step.deepLink && (
            <div style={{ marginTop: 'auto' }}>
              {step.deepLink.startsWith('http') ? (
                <a
                  href={step.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: C.yellow, fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', padding: '8px 14px',
                    background: `${C.yellow}18`, border: `1px solid ${C.yellow}44`,
                    borderRadius: 7,
                  }}
                >
                  Open in Airtable ↗
                </a>
              ) : (
                <a
                  href={step.deepLink}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: C.yellow, fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', padding: '8px 14px',
                    background: `${C.yellow}18`, border: `1px solid ${C.yellow}44`,
                    borderRadius: 7,
                  }}
                >
                  View full dashboard →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right: live data */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', minWidth: 0 }}>
          {loading && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, paddingTop: 20 }}>
              Loading live data…
            </div>
          )}
          {error && !loading && (
            <div style={{ color: '#fca5a5', fontSize: 12, padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
              Data error: {error}
            </div>
          )}
          {!loading && records.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)', padding: 16,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Live data · {records.length} record{records.length !== 1 ? 's' : ''}
              </div>
              {step.displayMode === 'summary' && (
                <SummaryPanel records={records} groupByField={step.groupByField} />
              )}
              {step.displayMode === 'records' && (
                <RecordsPanel records={records.slice(0, 12)} />
              )}
              {step.displayMode === 'funnel' && (
                <FunnelPanel records={records} groupByField={step.groupByField} />
              )}
            </div>
          )}
          {!loading && records.length === 0 && !error && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, paddingTop: 20 }}>
              No records match this filter.
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, background: '#0a1830',
      }}>
        <button
          onClick={() => goTo(currentId - 1)}
          disabled={currentId === 1}
          style={{
            background: currentId === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentId === 1 ? 'rgba(255,255,255,0.25)' : '#fff',
            border: 'none', padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: currentId === 1 ? 'default' : 'pointer',
          }}
        >
          ← Previous
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{step.act}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{step.title}</div>
        </div>

        <button
          onClick={() => currentId === STEPS.length ? router.push('/') : goTo(currentId + 1)}
          style={{
            background: currentId === STEPS.length ? `${C.yellow}22` : C.yellow,
            color: currentId === STEPS.length ? C.yellow : C.deep,
            border: currentId === STEPS.length ? `1px solid ${C.yellow}66` : 'none',
            padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {currentId === STEPS.length ? 'Back to Home' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
