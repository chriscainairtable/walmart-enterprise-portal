'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { SchemaResponse, SchemaTable } from '@/app/api/schema/route';

const C = {
  deep: '#0B2C5F', blue: '#0071CE', yellow: '#FFC220',
  green: '#16a34a', amber: '#d97706', red: '#dc2626',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB', muted: '#64748B', text: '#1E293B',
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

const BASE_IDS: Record<NodeId, string> = {
  l1:           'appCNBYNGcbSj7fNq',
  beacon:       'appwkie9ju54wkfYT',
  lighthouse:   'appy9LBctWK5O1lEb',
  orchestrator: 'appbcfht8yKGA4uQk',
  switchboard:  'appEYNscRBWFAlGsT',
};

const FIELD_TYPE_ICON: Record<string, string> = {
  singleLineText: '𝐓', multilineText: '¶', richText: '¶',
  singleSelect: '◉', multipleSelects: '◈',
  number: '#', currency: '$', percent: '%', rating: '★',
  date: '📅', dateTime: '📅',
  checkbox: '☑',
  multipleRecordLinks: '⇄', lookup: '↗', rollup: 'Σ', formula: 'ƒ',
  count: 'n', autoNumber: '01',
  email: '@', url: '🔗', phoneNumber: '☎',
  attachments: '📎',
  collaborator: '👤', multipleCollaborators: '👥',
  createdTime: '🕐', lastModifiedTime: '🕐', createdBy: '👤', lastModifiedBy: '👤',
  aiText: '✦',
  externalSyncSource: '⟳',
  button: '▶',
};

export default function ArchitecturePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [active, setActive] = useState<NodeId | null>('l1');
  const [tab, setTab] = useState<'overview' | 'schema'>('overview');
  const [schemaCache, setSchemaCache] = useState<Partial<Record<NodeId, SchemaResponse>>>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  const loadSchema = useCallback((nodeId: NodeId) => {
    if (schemaCache[nodeId]) return;
    setSchemaLoading(true);
    fetch(`/api/schema?base=${BASE_IDS[nodeId]}`)
      .then(r => r.json())
      .then((data: SchemaResponse) => {
        setSchemaCache(prev => ({ ...prev, [nodeId]: data }));
        // Auto-expand first table
        if (data.tables?.[0]) setExpandedTables(new Set([data.tables[0].id]));
      })
      .catch(() => {})
      .finally(() => setSchemaLoading(false));
  }, [schemaCache]);

  const handleSelect = (id: NodeId) => {
    setActive(id);
    setTab('overview');
    setExpandedTables(new Set());
  };

  const handleTabChange = (t: 'overview' | 'schema') => {
    setTab(t);
    if (t === 'schema' && active) loadSchema(active);
  };

  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
      return next;
    });
  };

  const detail = active ? NODE_DETAILS[active] : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.deep, letterSpacing: '-0.02em' }}>
              Platform Architecture
            </h1>
            <span title={`Built: ${process.env.NEXT_PUBLIC_BUILD_TIME}`} style={{
              fontSize: 10, fontWeight: 600, color: '#94a3b8',
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 5, padding: '3px 8px', letterSpacing: '0.04em',
              fontFamily: 'monospace', flexShrink: 0, marginTop: 4,
            }}>
              {process.env.NEXT_PUBLIC_BUILD_SHA} · {process.env.NEXT_PUBLIC_BUILD_TIME}
            </span>
          </div>
          <p style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>
            Five Airtable bases connected as a single enterprise planning system.
            {meta && ` ${meta.l1.initiatives} initiatives · ${meta.beacon.capabilities + meta.lighthouse.capabilities} capabilities · ${meta.switchboard.crossOrgDeps} cross-org dependencies.`}
            {!meta && ' Loading live counts…'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* ERD Diagram */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ERDDiagram meta={meta} active={active} onSelect={handleSelect} />
          </div>

          {/* Detail panel */}
          <div style={{ width: 340, flexShrink: 0 }}>
            {detail && meta ? (
              <div style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                {/* Header */}
                <div style={{ background: detail.color, padding: '14px 20px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{detail.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>{detail.subtitle}</div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
                  {(['overview', 'schema'] as const).map(t => (
                    <button key={t} onClick={() => handleTabChange(t)} style={{
                      flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: 'none',
                      background: tab === t ? C.card : '#f8fafc',
                      color: tab === t ? detail.color : C.muted,
                      borderBottom: tab === t ? `2px solid ${detail.color}` : '2px solid transparent',
                      textTransform: 'capitalize',
                    }}>
                      {t === 'schema' ? 'Schema' : 'Overview'}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <div style={{ padding: '14px 20px' }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {detail.bullets(meta).map((b, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#334155' }}>
                          <span style={{ color: detail.color, marginTop: 2, flexShrink: 0 }}>•</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
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
                )}

                {tab === 'schema' && (
                  <SchemaPanel
                    schema={active ? schemaCache[active] : undefined}
                    loading={schemaLoading}
                    color={detail.color}
                    expandedTables={expandedTables}
                    onToggleTable={toggleTable}
                  />
                )}
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
    { id: 'l1',           x: 110, y: 20,  w: 400, h: 72, label: 'L1  Strategic Portfolio', sub: 'Single pane of glass',   color: C.blue },
    { id: 'beacon',       x: 20,  y: 160, w: 175, h: 72, label: 'Beacon Shell',            sub: 'Tech org',               color: '#0891b2' },
    { id: 'lighthouse',   x: 424, y: 160, w: 175, h: 72, label: 'Lighthouse',              sub: 'Non-tech org',           color: '#7c3aed' },
    { id: 'orchestrator', x: 20,  y: 330, w: 270, h: 72, label: 'Orchestrator',            sub: 'Coordination layer',     color: '#475569' },
    { id: 'switchboard',  x: 320, y: 330, w: 280, h: 72, label: 'L3  Switchboard',         sub: 'Cross-org dependencies', color: '#d97706' },
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
          // Route edge to nearest border; handle same-row horizontal arrows
          let fx, fy, tx, ty;
          if (Math.abs(fc.y - tc.y) < 20) {
            if (fc.x < tc.x) { fx = from.x + from.w; fy = fc.y; tx = to.x; ty = tc.y; }
            else              { fx = from.x; fy = fc.y; tx = to.x + to.w; ty = tc.y; }
          } else {
            fx = fc.x; fy = from.y < to.y ? from.y + from.h : from.y;
            tx = tc.x; ty = to.y < from.y ? to.y + to.h : to.y;
          }
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

        {/* Future Org Base — dashed placeholder at L2 */}
        <g style={{ pointerEvents: 'none' }}>
          <rect x={222} y={160} width={175} height={72} rx={8}
            fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5}
            strokeDasharray="6 3" opacity={0.6} />
          <text x={309} y={186} textAnchor="middle"
            fontSize={11} fontWeight={600} fill="#94a3b8">Future Org Base</text>
          <text x={309} y={200} textAnchor="middle"
            fontSize={9} fill="#94a3b8">from Component Spine</text>
          <text x={309} y={216} textAnchor="middle"
            fontSize={9} fill="#b0bec5">Supply Chain · Design · …</text>
        </g>

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

// ── Schema Panel ──────────────────────────────────────────────────────────────
function SchemaPanel({
  schema, loading, color, expandedTables, onToggleTable,
}: {
  schema: SchemaResponse | undefined;
  loading: boolean;
  color: string;
  expandedTables: Set<string>;
  onToggleTable: (id: string) => void;
}) {
  if (loading) return (
    <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12 }}>Loading schema…</div>
  );
  if (!schema) return (
    <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12 }}>No schema data</div>
  );

  const sharedFields = schema.sharedFieldSummary.filter(s => s.bases.length > 1);

  return (
    <div style={{ maxHeight: 520, overflowY: 'auto' }}>
      {/* Shared fields banner */}
      {sharedFields.length > 0 && (
        <div style={{ padding: '10px 16px', background: `${color}08`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Shared with other bases ({sharedFields.length} fields)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {sharedFields.slice(0, 12).map(sf => (
              <span key={sf.fieldName} title={`Also in: ${sf.bases.join(', ')}`} style={{
                fontSize: 10, background: `${color}15`, color,
                border: `1px solid ${color}30`, borderRadius: 4,
                padding: '2px 6px', cursor: 'default',
              }}>
                {sf.fieldName}
                <span style={{ opacity: 0.6, marginLeft: 3 }}>×{sf.bases.length}</span>
              </span>
            ))}
            {sharedFields.length > 12 && (
              <span style={{ fontSize: 10, color: C.muted }}>+{sharedFields.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      {/* Tables */}
      <div>
        {schema.tables.map((table: SchemaTable) => {
          const isExpanded = expandedTables.has(table.id);
          const sharedCount = table.fields.filter(f => f.sharedWith.length > 0).length;
          return (
            <div key={table.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => onToggleTable(table.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: isExpanded ? `${color}06` : 'transparent',
                } as React.CSSProperties}
              >
                <span style={{ fontSize: 10, color: C.muted, width: 10 }}>{isExpanded ? '▾' : '▸'}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text }}>{table.name}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{table.fields.length} fields</span>
                {sharedCount > 0 && (
                  <span style={{ fontSize: 9, background: `${color}15`, color, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                    {sharedCount} shared
                  </span>
                )}
              </button>

              {isExpanded && (
                <div style={{ paddingBottom: 6 }}>
                  {table.fields.map(field => {
                    const isShared = field.sharedWith.length > 0;
                    const icon = FIELD_TYPE_ICON[field.type] || '·';
                    return (
                      <div key={field.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 16px 4px 28px',
                        background: isShared ? `${color}05` : 'transparent',
                      }}>
                        <span style={{ fontSize: 10, color: C.muted, width: 14, flexShrink: 0, textAlign: 'center' }}>{icon}</span>
                        <span style={{ fontSize: 11, color: isShared ? '#1e293b' : '#475569', flex: 1, fontWeight: isShared ? 500 : 400 }}>
                          {field.name}
                        </span>
                        {isShared && (
                          <span title={`Also in: ${field.sharedWith.join(', ')}`} style={{
                            fontSize: 9, color, background: `${color}18`,
                            padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                            flexShrink: 0, cursor: 'default',
                          }}>
                            ⇄ {field.sharedWith.length > 1 ? `${field.sharedWith.length} bases` : field.sharedWith[0].split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
