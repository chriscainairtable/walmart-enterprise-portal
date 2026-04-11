'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { STEPS, NodeId, SyncId } from '@/lib/storySteps';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#080f1e', surface: 'rgba(255,255,255,0.05)', surfaceHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.09)', borderStrong: 'rgba(255,255,255,0.18)',
  blue: '#0071CE', yellow: '#FFC220', deep: '#0B2C5F',
  nodeBeacon: '#0891b2', nodeLighthouse: '#7c3aed', nodeSwitch: '#d97706', nodeOrch: '#64748b',
};

const ACT_COLOR: Record<string, string> = {
  'Act I — Initiative Reporting':     '#60a5fa',
  'Act II — Capability Execution':    '#22d3ee',
  'Act III — Cross-Org Dependencies': '#fb923c',
  'Act IV — The Full System':         '#FFC220',
};

// Status colors — bright versions for dark bg
const SC: Record<string, string> = {
  'On Track': '#4ade80', 'Complete': '#60a5fa', 'At Risk': '#fbbf24',
  'Off Track': '#f87171', 'Blocked': '#f87171', 'In Progress': '#fb923c',
  'In Flight': '#fb923c', 'Not Started': '#94a3b8', 'Paused': '#94a3b8',
  'Draft': '#cbd5e1', 'Declared': '#94a3b8', 'Routed': '#c4b5fd',
  'Acknowledged': '#93c5fd', 'Resolved': '#86efac', 'Confirmed': '#93c5fd',
  'Approved': '#d8b4fe', 'Cancelled': '#94a3b8', 'Archived': '#94a3b8',
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function sel(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'object' && v !== null && 'name' in v) return (v as { name: string }).name;
  return String(v);
}
function fmt$(n: number) {
  return n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`;
}

// ── Architecture Diagram (step 12 only) ───────────────────────────────────────
const MAP_W = 580, MAP_H = 210;
type NodeDef = { id: NodeId; x: number; y: number; w: number; h: number; label: string; sub: string };
const NODE_COLOR: Record<NodeId, string> = {
  l1: C.blue, beacon: C.nodeBeacon, lighthouse: C.nodeLighthouse,
  orchestrator: C.nodeOrch, switchboard: C.nodeSwitch,
};
const NODES: NodeDef[] = [
  { id: 'l1',           x: 90,  y: 8,   w: 400, h: 52, label: 'L1 — Strategic Portfolio', sub: 'Executive visibility layer' },
  { id: 'beacon',       x: 8,   y: 98,  w: 154, h: 52, label: 'Beacon Shell',              sub: 'Tech org · Jira-linked' },
  { id: 'orchestrator', x: 213, y: 98,  w: 154, h: 52, label: 'Orchestrator',              sub: 'Coordination layer' },
  { id: 'lighthouse',   x: 418, y: 98,  w: 154, h: 52, label: 'Lighthouse',                sub: 'Finance / Strategy' },
  { id: 'switchboard',  x: 90,  y: 152, w: 400, h: 52, label: 'L3 — Switchboard',         sub: 'Cross-org dependencies' },
];
const SYNCS: { id: SyncId; from: NodeId; to: NodeId; color: string; dash: boolean }[] = [
  { id: 'beacon-l1',                from: 'beacon',       to: 'l1',          color: '#60a5fa', dash: false },
  { id: 'lighthouse-l1',            from: 'lighthouse',   to: 'l1',          color: '#60a5fa', dash: false },
  { id: 'orchestrator-l1',          from: 'orchestrator', to: 'l1',          color: '#94a3b8', dash: true  },
  { id: 'beacon-switchboard',       from: 'beacon',       to: 'switchboard', color: '#fbbf24', dash: true  },
  { id: 'lighthouse-switchboard',   from: 'lighthouse',   to: 'switchboard', color: '#fbbf24', dash: true  },
  { id: 'orchestrator-switchboard', from: 'orchestrator', to: 'switchboard', color: '#94a3b8', dash: true  },
];

function ArchDiagram({ highlightNodes, highlightSyncs }: { highlightNodes: NodeId[]; highlightSyncs: SyncId[] }) {
  const nodeMap = new Map(NODES.map(n => [n.id, n]));
  const cx = (n: NodeDef) => n.x + n.w / 2;

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <style>{`
        @keyframes ants { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        .ants { animation: ants 0.6s linear infinite; }
      `}</style>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          {['blue','amber','slate'].map((n, i) => (
            <marker key={n} id={`a-${n}`} markerWidth={7} markerHeight={7} refX={5} refY={3} orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill={['#60a5fa','#fbbf24','#94a3b8'][i]} />
            </marker>
          ))}
          {NODES.map(n => (
            <filter key={n.id} id={`g-${n.id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {/* Layer labels */}
        <text x={4} y={38}  fontSize={8} fill="rgba(255,255,255,0.3)" fontWeight={700} letterSpacing={1}>L1</text>
        <text x={4} y={128} fontSize={8} fill="rgba(255,255,255,0.3)" fontWeight={700} letterSpacing={1}>L2</text>
        <text x={4} y={182} fontSize={8} fill="rgba(255,255,255,0.3)" fontWeight={700} letterSpacing={1}>L3</text>

        {/* Connections */}
        {SYNCS.map(s => {
          const from = nodeMap.get(s.from)!;
          const to   = nodeMap.get(s.to)!;
          const hl   = highlightSyncs.includes(s.id);
          const fy   = from.y < to.y ? from.y + from.h : from.y;
          const ty   = to.y < from.y ? to.y + to.h     : to.y;
          const mk   = s.color === '#60a5fa' ? 'blue' : s.color === '#fbbf24' ? 'amber' : 'slate';
          return (
            <line key={s.id}
              x1={cx(from)} y1={fy} x2={cx(to)} y2={ty}
              stroke={s.color} strokeWidth={hl ? 2.5 : 1}
              strokeDasharray="6 4"
              markerEnd={`url(#a-${mk})`}
              opacity={hl ? 1 : 0.2}
              className={hl ? 'ants' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const hl    = highlightNodes.includes(n.id);
          const color = NODE_COLOR[n.id];
          return (
            <g key={n.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={8}
                fill={hl ? color : 'rgba(255,255,255,0.04)'}
                stroke={hl ? color : 'rgba(255,255,255,0.12)'}
                strokeWidth={hl ? 2 : 1}
                filter={hl ? `url(#g-${n.id})` : undefined}
              />
              <text x={cx(n)} y={n.y + 21} textAnchor="middle"
                fontSize={11} fontWeight={700} fill={hl ? '#fff' : 'rgba(255,255,255,0.35)'}>
                {n.label}
              </text>
              <text x={cx(n)} y={n.y + 37} textAnchor="middle"
                fontSize={9} fill={hl ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)'}>
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Data Panels ───────────────────────────────────────────────────────────────
function SummaryPanel({ records, groupByField, actColor }: {
  records: AirtableRecord[]; groupByField?: string; actColor: string;
}) {
  const field  = groupByField || 'Status';
  const counts: Record<string, number> = {};
  records.forEach(r => { const v = sel(r.fields[field]) || 'Unknown'; counts[v] = (counts[v] || 0) + 1; });
  const total  = records.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max    = sorted[0]?.[1] || 1;

  const hasFinancials = records.some(r => r.fields['Annual Revenue Impact'] || r.fields['Investment Required']);
  const totalRev = records.reduce((s, r) => s + ((r.fields['Annual Revenue Impact'] as number) || 0), 0);
  const totalSav = records.reduce((s, r) => s + ((r.fields['Annual Cost Savings']   as number) || 0), 0);
  const totalInv = records.reduce((s, r) => s + ((r.fields['Investment Required']    as number) || 0), 0);

  // Top KPI cards for status summary
  const KPI_STATUSES = ['On Track', 'At Risk', 'Off Track', 'Complete', 'In Progress', 'Not Started'];
  const kpiStats = KPI_STATUSES.filter(s => counts[s]).map(s => ({ label: s, val: counts[s], color: SC[s] || actColor }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI cards */}
      {kpiStats.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {kpiStats.map(k => (
            <div key={k.label} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '14px 20px', textAlign: 'center', minWidth: 90, flex: '1 1 90px',
              borderTop: `3px solid ${k.color}`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 5 }}>{k.label}</div>
            </div>
          ))}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '14px 20px', textAlign: 'center', minWidth: 90, flex: '1 1 90px',
            borderTop: `3px solid ${actColor}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 5 }}>Total</div>
          </div>
        </div>
      )}

      {/* Financial stats */}
      {hasFinancials && (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Revenue Impact', val: fmt$(totalRev), color: '#4ade80' },
            { label: 'Cost Savings',   val: fmt$(totalSav), color: '#22d3ee' },
            { label: 'Investment',     val: fmt$(totalInv), color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '14px 20px', flex: 1, textAlign: 'center', borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Distribution bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {field} Distribution — {total} records
        </div>
        {sorted.slice(0, 8).map(([label, count]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 96, fontSize: 12, color: 'rgba(255,255,255,0.7)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </div>
            <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${(count / max) * 100}%`, height: '100%',
                background: SC[label] || actColor,
                borderRadius: 4, opacity: 0.85,
                transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{ width: 32, fontSize: 13, fontWeight: 800, color: SC[label] || actColor, textAlign: 'right', flexShrink: 0 }}>
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordsPanel({ records }: { records: AirtableRecord[] }) {
  const SKIP = new Set(['Name', 'Capability Name', 'Dependency Name', 'Status', 'Lifecycle', 'Priority']);
  const META_KEYS = ['Pillar', 'Source Org', 'Product Lifecycle Stage', 'Engineering Lead', 'Owner', 'Requesting Org', 'Resolving Org', 'Primary Product', 'Size', 'ATL/BTL'];

  return (
    <div style={{ columns: '2', gap: 10 }}>
      {records.map(r => {
        const f      = r.fields;
        const name   = (f['Name'] || f['Capability Name'] || f['Dependency Name'] || f['Action Name'] || 'Untitled') as string;
        const status = sel(f['Status'] || f['Lifecycle']);
        const color  = SC[status] || 'rgba(255,255,255,0.4)';
        const meta: string[] = [];
        META_KEYS.forEach(k => { if (!SKIP.has(k) && f[k]) { const v = sel(f[k]); if (v) meta.push(v); } });
        if (f['Annual Revenue Impact']) meta.unshift(`Rev: ${fmt$((f['Annual Revenue Impact'] as number))}`);
        if (f['Date to Green'])         meta.push(`→ Green: ${(f['Date to Green'] as string).slice(0, 10)}`);
        if (f['Target Resolution Date'])meta.push(`Target: ${(f['Target Resolution Date'] as string).slice(0, 10)}`);

        return (
          <div key={r.id} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 8, padding: '10px 12px',
            display: 'inline-block', width: '100%', boxSizing: 'border-box', marginBottom: 8,
            breakInside: 'avoid',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>{name}</span>
              {status && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color, background: `${color}22`,
                  padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                }}>{status}</span>
              )}
            </div>
            {meta.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {meta.slice(0, 4).map((m, i) => (
                  <span key={i} style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.45)',
                    background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px',
                  }}>{m}</span>
                ))}
              </div>
            )}
            {!!f['Plan to Green'] && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.45, borderLeft: '2px solid #fbbf24', paddingLeft: 6 }}>
                {(f['Plan to Green'] as string).slice(0, 100)}{(f['Plan to Green'] as string).length > 100 ? '…' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelPanel({ records, groupByField, actColor }: {
  records: AirtableRecord[]; groupByField?: string; actColor: string;
}) {
  const field = groupByField || 'Lifecycle';
  const ORDER = ['Declared', 'Routed', 'Acknowledged', 'In Progress', 'Resolved', 'Archived', 'Cancelled'];
  const counts: Record<string, number> = {};
  records.forEach(r => { const v = sel(r.fields[field]) || 'Unknown'; counts[v] = (counts[v] || 0) + 1; });
  const ordered = ORDER.filter(s => counts[s]).map(s => [s, counts[s]] as [string, number]);
  const rest    = Object.entries(counts).filter(([s]) => !ORDER.includes(s)).sort((a, b) => b[1] - a[1]);
  const sorted  = [...ordered, ...rest];
  const total   = records.length;
  const max     = sorted[0]?.[1] || 1;
  const DONE    = new Set(['Resolved', 'Cancelled', 'Archived']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {field} Funnel — {total} total
      </div>
      {sorted.map(([label, count]) => {
        const pct     = Math.round((count / max) * 100);
        const pctTot  = total > 0 ? Math.round((count / total) * 100) : 0;
        const active  = !DONE.has(label);
        const color   = SC[label] || actColor;
        return (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400 }}>{label}</span>
                {active && (
                  <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}22`, padding: '1px 7px', borderRadius: 999, letterSpacing: '0.04em' }}>ACTIVE</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{pctTot}%</span>
                <span style={{ fontSize: 20, fontWeight: 900, color, width: 36, textAlign: 'right', lineHeight: 1 }}>{count}</span>
              </div>
            </div>
            <div style={{ height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: color, borderRadius: 6,
                opacity: active ? 0.85 : 0.3,
                transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoryPage() {
  const router = useRouter();
  const [currentId, setCurrentId]   = useState(1);
  const [records, setRecords]        = useState<AirtableRecord[]>([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState<string | null>(null);
  const [animKey, setAnimKey]        = useState(0);
  const fetchController = useRef<AbortController | null>(null);

  const step     = STEPS.find(s => s.id === currentId) || STEPS[0];
  const actColor = ACT_COLOR[step.act] || '#60a5fa';
  const showArch = step.id === 12; // only full-system step shows the diagram

  const goTo = useCallback((id: number) => {
    const clamped = Math.max(1, Math.min(STEPS.length, id));
    setCurrentId(clamped);
    setAnimKey(k => k + 1);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentId + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentId - 1);
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [currentId, goTo, router]);

  useEffect(() => {
    if (fetchController.current) fetchController.current.abort();
    const ctrl = new AbortController();
    fetchController.current = ctrl;
    setLoading(true); setError(null); setRecords([]);
    fetch(`/api/story/${step.id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (!ctrl.signal.aborted) { setRecords((d.records || []) as AirtableRecord[]); if (d.error) setError(d.error); } })
      .catch(e => { if (e.name !== 'AbortError') setError('Failed to load data'); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [step.id]);

  // Act groups for bottom dots
  const acts = [...new Set(STEPS.map(s => s.act))];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .slide-in { animation: slideUp 0.35s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes ants { from { stroke-dashoffset:20; } to { stroke-dashoffset:0; } }
        .ants { animation: ants 0.6s linear infinite; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 48, borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,15,30,0.8)', backdropFilter: 'blur(12px)',
        flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: C.surface, border: `1px solid ${C.border}`, color: 'rgba(255,255,255,0.6)',
          padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
        }}>
          ← Exit
        </button>

        {/* Act breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {acts.map(act => {
            const steps = STEPS.filter(s => s.act === act);
            const isCurrentAct = act === step.act;
            const color = ACT_COLOR[act] || '#60a5fa';
            return (
              <div key={act} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {steps.map(s => (
                  <button key={s.id} onClick={() => goTo(s.id)} title={s.title} style={{
                    width: s.id === currentId ? 20 : 7, height: 7, borderRadius: 4,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: s.id === currentId ? C.yellow : s.id < currentId ? `${color}99` : 'rgba(255,255,255,0.15)',
                  }} />
                ))}
                {act !== acts[acts.length - 1] && (
                  <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          {currentId} / {STEPS.length}
        </div>
      </div>

      {/* ── Main slide content ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div key={animKey} className="slide-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 900, width: '100%', margin: '0 auto', padding: '44px 40px 32px', boxSizing: 'border-box' }}>

          {/* Act pill */}
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            background: `${actColor}18`, color: actColor,
            border: `1px solid ${actColor}44`, borderRadius: 999,
            fontSize: 10, fontWeight: 700, padding: '3px 12px',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            {step.act}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            {step.title}
          </h1>

          {/* Narrative */}
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: '0 0 36px', maxWidth: 660 }}>
            {step.narrative}
          </p>

          {/* Arch diagram — step 12 only */}
          {showArch && (
            <div style={{ marginBottom: 32 }}>
              <ArchDiagram highlightNodes={step.highlightNodes} highlightSyncs={step.highlightSyncs} />
            </div>
          )}

          {/* Data panel */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${actColor}44`, borderTopColor: actColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading live data…
            </div>
          )}
          {error && !loading && (
            <div style={{ color: '#fca5a5', fontSize: 12, padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </div>
          )}
          {!loading && records.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: actColor, display: 'inline-block' }} />
                Live data · {records.length} record{records.length !== 1 ? 's' : ''}
              </div>
              {step.displayMode === 'summary' && (
                <SummaryPanel records={records} groupByField={step.groupByField} actColor={actColor} />
              )}
              {step.displayMode === 'records' && (
                <RecordsPanel records={records.slice(0, 14)} />
              )}
              {step.displayMode === 'funnel' && (
                <FunnelPanel records={records} groupByField={step.groupByField} actColor={actColor} />
              )}
            </div>
          )}
          {!loading && records.length === 0 && !error && (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No records match this filter.</div>
          )}

          {/* Deep link */}
          {step.deepLink && !loading && (
            <div style={{ marginTop: 32 }}>
              {step.deepLink.startsWith('http') ? (
                <a href={step.deepLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: actColor, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  padding: '7px 14px', background: `${actColor}14`, border: `1px solid ${actColor}44`, borderRadius: 7,
                }}>Open in Airtable ↗</a>
              ) : (
                <a href={step.deepLink} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: actColor, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  padding: '7px 14px', background: `${actColor}14`, border: `1px solid ${actColor}44`, borderRadius: 7,
                }}>View full dashboard →</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60, borderTop: `1px solid ${C.border}`,
        background: 'rgba(8,15,30,0.9)', backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <button onClick={() => goTo(currentId - 1)} disabled={currentId === 1} style={{
          background: currentId === 1 ? 'transparent' : C.surface,
          color: currentId === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
          border: `1px solid ${currentId === 1 ? 'transparent' : C.border}`,
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: currentId === 1 ? 'default' : 'pointer',
        }}>
          ← Previous
        </button>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          {step.title}
        </div>

        <button onClick={() => currentId === STEPS.length ? router.push('/') : goTo(currentId + 1)} style={{
          background: currentId === STEPS.length ? 'transparent' : C.yellow,
          color: currentId === STEPS.length ? C.yellow : C.deep,
          border: currentId === STEPS.length ? `1px solid ${C.yellow}66` : 'none',
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          {currentId === STEPS.length ? 'Back to Home' : 'Next →'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
