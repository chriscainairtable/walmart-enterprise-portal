'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const C = {
  deep: '#0B2C5F', blue: '#0071CE', yellow: '#FFC220',
  green: '#16a34a', amber: '#d97706', red: '#dc2626',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB', muted: '#64748B',
};

type Meta = {
  l1: { initiatives: number; programs: number; workstreams: number; mscCapabilities: number };
  beacon: { capabilities: number; jiraEpics: number };
  lighthouse: { capabilities: number; actions: number };
  switchboard: { crossOrgDeps: number };
};

type NodeId = 'l1' | 'beacon' | 'lighthouse' | 'orchestrator' | 'switchboard';

const NODE_DETAILS: Record<NodeId, { title: string; subtitle: string; color: string; link: string; linkLabel: string; bullets: (meta: Meta) => string[] }> = {
  l1: {
    title: 'L1 Strategic Portfolio',
    subtitle: 'Single pane of glass — blends tech + non-tech',
    color: C.blue,
    link: '/initiatives',
    linkLabel: 'View Initiative Portfolio →',
    bullets: (m) => [
      `${m.l1.initiatives} initiatives across all orgs`,
      `${m.l1.programs} programs · ${m.l1.workstreams} workstreams`,
      `${m.l1.mscCapabilities} capabilities synced from Beacon + Lighthouse`,
      'Financial rollups: Revenue, Cost Savings, Investment, ROI',
      'Status: On Track / At Risk / Off Track / Complete',
    ],
  },
  beacon: {
    title: 'Beacon Shell',
    subtitle: 'Tech org — capability tracking + Jira integration',
    color: '#0891b2',
    link: '/dependencies',
    linkLabel: 'View Dependency Map →',
    bullets: (m) => [
      `${m.beacon.capabilities} capabilities tracked`,
      `${m.beacon.jiraEpics} Jira epics linked`,
      'Syncs capability status up to L1 via Multi Source Capabilities',
      'Local + cross-org dependency tracking',
      'Product lifecycle stages: Discover → Deploy → Operate',
    ],
  },
  lighthouse: {
    title: 'Lighthouse',
    subtitle: 'Non-tech org — finance, strategy, HR capabilities',
    color: '#7c3aed',
    link: '/dependencies',
    linkLabel: 'View Dependency Map →',
    bullets: (m) => [
      `${m.lighthouse.capabilities} capabilities tracked`,
      `${m.lighthouse.actions} actions with owners + due dates`,
      'Syncs capability status up to L1 via Multi Source Capabilities',
      'Cross-org deps surfaced in Switchboard',
      'Finance-driven lifecycle: Budget Approval, Compliance Review',
    ],
  },
  orchestrator: {
    title: 'L3 Orchestrator',
    subtitle: 'Coordination layer — no interface extension needed',
    color: '#475569',
    link: 'https://airtabledemo.com/appbcfht8yKGA4uQk',
    linkLabel: 'Open in Airtable ↗',
    bullets: () => [
      'Manages routing + escalation logic between L2 orgs',
      'No public-facing extension — internal coordination only',
      'Cross-org signals flow through here to Switchboard',
    ],
  },
  switchboard: {
    title: 'L3 Switchboard',
    subtitle: 'Cross-org dependency visibility + lifecycle tracking',
    color: '#d97706',
    link: '/dependencies',
    linkLabel: 'View Dependency Map →',
    bullets: (m) => [
      `${m.switchboard.crossOrgDeps} active cross-org dependencies`,
      'Receives flagged deps from Beacon + Lighthouse',
      'Lifecycle: Declared → Routed → In Progress → Resolved',
      'Priority: Critical · High · Medium · Low',
    ],
  },
};

export default function ArchitecturePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [active, setActive] = useState<NodeId | null>('l1');

  useEffect(() => {
    fetch('/api/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  const detail = active ? NODE_DETAILS[active] : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.deep, letterSpacing: '-0.02em' }}>
            Platform Architecture
          </h1>
          <p style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>
            Five Airtable bases connected as a single enterprise planning system.
            {meta && ` ${meta.l1.initiatives} initiatives · ${meta.beacon.capabilities + meta.lighthouse.capabilities} capabilities · ${meta.switchboard.crossOrgDeps} cross-org dependencies.`}
            {!meta && ' Loading live counts…'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* ERD Diagram */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ERDDiagram meta={meta} active={active} onSelect={setActive} />
          </div>

          {/* Detail panel */}
          <div style={{ width: 320, flexShrink: 0 }}>
            {detail && meta ? (
              <div style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <div style={{ background: detail.color, padding: '16px 20px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{detail.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 }}>{detail.subtitle}</div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detail.bullets(meta).map((b, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#334155' }}>
                        <span style={{ color: detail.color, marginTop: 2, flexShrink: 0 }}>•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    {detail.link.startsWith('http') ? (
                      <a href={detail.link} target="_blank" rel="noopener noreferrer"
                        style={{ color: detail.color, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                        {detail.linkLabel}
                      </a>
                    ) : (
                      <Link href={detail.link}
                        style={{ color: detail.color, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                        {detail.linkLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center', color: C.muted, fontSize: 13 }}>
                Click any node to see details
              </div>
            )}

            {/* Sync legend */}
            <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Data Flow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { color: C.blue,  label: 'Capability sync ↑ to L1', dash: false },
                  { color: C.amber, label: 'Dep escalation → Switchboard', dash: true },
                  { color: '#94a3b8', label: 'Coordination (Orchestrator)', dash: true },
                ].map(({ color, label, dash }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
                    <svg width={32} height={10}>
                      <line x1={0} y1={5} x2={32} y2={5} stroke={color} strokeWidth={2}
                        strokeDasharray={dash ? '4 3' : undefined} />
                      <polygon points="26,2 32,5 26,8" fill={color} />
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        {meta && (
          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            {[
              { label: 'Initiatives', value: meta.l1.initiatives, color: C.blue },
              { label: 'Programs', value: meta.l1.programs, color: C.blue },
              { label: 'MSC Capabilities', value: meta.l1.mscCapabilities, color: '#0891b2' },
              { label: 'Beacon Epics', value: meta.beacon.jiraEpics, color: '#0891b2' },
              { label: 'Lighthouse Actions', value: meta.lighthouse.actions, color: '#7c3aed' },
              { label: 'Cross-Org Deps', value: meta.switchboard.crossOrgDeps, color: C.amber },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '12px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Interactive ERD ──────────────────────────────────────────────────────────
function ERDDiagram({ meta, active, onSelect }: {
  meta: Meta | null;
  active: NodeId | null;
  onSelect: (id: NodeId) => void;
}) {
  const W = 620, H = 460;

  // Node definitions [id, x, y, w, h, label, sublabel, color]
  type NodeDef = { id: NodeId; x: number; y: number; w: number; h: number; label: string; sub: string; color: string };
  const nodes: NodeDef[] = [
    { id: 'l1',           x: 110, y: 20,  w: 400, h: 72, label: 'L1  Strategic Portfolio', sub: 'Single pane of glass',  color: C.blue },
    { id: 'beacon',       x: 20,  y: 160, w: 175, h: 72, label: 'Beacon Shell',            sub: 'Tech org',              color: '#0891b2' },
    { id: 'orchestrator', x: 222, y: 160, w: 175, h: 72, label: 'Orchestrator',            sub: 'Coordination layer',    color: '#475569' },
    { id: 'lighthouse',   x: 424, y: 160, w: 175, h: 72, label: 'Lighthouse',              sub: 'Non-tech org',          color: '#7c3aed' },
    { id: 'switchboard',  x: 110, y: 330, w: 400, h: 72, label: 'L3  Switchboard',         sub: 'Cross-org dependencies', color: '#d97706' },
  ];

  // Helper to get node center
  const center = (n: NodeDef) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

  // Arrows: [from, to, color, dash]
  const arrows: [NodeId, NodeId, string, boolean][] = [
    ['beacon', 'l1', C.blue, false],
    ['lighthouse', 'l1', C.blue, false],
    ['beacon', 'switchboard', C.amber, true],
    ['lighthouse', 'switchboard', C.amber, true],
    ['orchestrator', 'switchboard', '#94a3b8', true],
    ['orchestrator', 'l1', '#94a3b8', true],
  ];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const getCount = (id: NodeId): string => {
    if (!meta) return '…';
    switch (id) {
      case 'l1': return `${meta.l1.initiatives} initiatives`;
      case 'beacon': return `${meta.beacon.capabilities} capabilities`;
      case 'lighthouse': return `${meta.lighthouse.capabilities} capabilities`;
      case 'switchboard': return `${meta.switchboard.crossOrgDeps} deps`;
      case 'orchestrator': return 'coordination';
    }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted }}>
        System Architecture — click any base to explore
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', padding: 16 }}>
        {/* Layer labels */}
        <text x={8} y={62} fontSize={9} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L1</text>
        <text x={8} y={202} fontSize={9} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L2</text>
        <text x={8} y={372} fontSize={9} fill="#94a3b8" fontWeight={700} letterSpacing={1}>L3</text>

        {/* Arrows */}
        <defs>
          {['blue','teal','amber','slate'].map((n, i) => {
            const colors = [C.blue, '#0891b2', C.amber, '#94a3b8'];
            return (
              <marker key={n} id={`arrow-${n}`} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={colors[i]} />
              </marker>
            );
          })}
        </defs>

        {arrows.map(([fromId, toId, color, dash], i) => {
          const from = nodeMap.get(fromId)!;
          const to = nodeMap.get(toId)!;
          const fc = center(from);
          const tc = center(to);
          // Route edge to nearest border
          const fx = fc.x;
          const fy = from.y < to.y ? from.y + from.h : from.y;
          const tx = tc.x;
          const ty = to.y < from.y ? to.y + to.h : to.y;
          const markerColor = color === C.blue ? 'blue' : color === C.amber ? 'amber' : 'slate';
          return (
            <line key={i} x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={color} strokeWidth={1.5}
              strokeDasharray={dash ? '5 4' : undefined}
              markerEnd={`url(#arrow-${markerColor})`}
              opacity={0.7}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const isActive = active === n.id;
          return (
            <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(n.id)}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={8}
                fill={isActive ? n.color : '#fff'}
                stroke={isActive ? n.color : '#e2e8f0'}
                strokeWidth={isActive ? 2 : 1}
                style={{ filter: isActive ? `drop-shadow(0 0 8px ${n.color}55)` : undefined }}
              />
              <text x={n.x + n.w / 2} y={n.y + 26} textAnchor="middle"
                fontSize={13} fontWeight={700} fill={isActive ? '#fff' : '#1e293b'}>
                {n.label}
              </text>
              <text x={n.x + n.w / 2} y={n.y + 42} textAnchor="middle"
                fontSize={10} fill={isActive ? 'rgba(255,255,255,0.75)' : '#64748b'}>
                {n.sub}
              </text>
              <text x={n.x + n.w / 2} y={n.y + 58} textAnchor="middle"
                fontSize={10} fontWeight={600} fill={isActive ? 'rgba(255,255,255,0.9)' : n.color}>
                {getCount(n.id)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
