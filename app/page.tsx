'use client';
import React, { useEffect, useState, useCallback } from 'react';
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
    subtitle: 'Reference data layer — people, teams, products, projects',
    color: '#475569',
    link: 'https://airtabledemo.com/appbcfht8yKGA4uQk',
    linkLabel: 'Open Phone Book ↗',
    bullets: () => [
      '10 people · 9 teams · 8 products · 7 Jira projects',
      'Canonical reference data distributed across all org bases',
      'People Directory: search by org, role, or pillar',
      'Teams + Products: delivery org structure at a glance',
      'Jira Projects: cross-referenced to Beacon capabilities',
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

type PreviewType = 'initiatives' | 'programs' | 'msc' | 'beacon-epics' | 'lighthouse-actions' | 'deps';
type PreviewRecord = Record<string, unknown>;

const PREVIEW_CONFIG: Record<PreviewType, {
  title: string; color: string;
  columns: { key: string; label: string; bold?: boolean; badge?: boolean; mono?: boolean; date?: boolean }[];
}> = {
  initiatives: {
    title: 'Initiatives', color: C.blue,
    columns: [
      { key: 'name',     label: 'Name',     bold: true },
      { key: 'status',   label: 'Status',   badge: true },
      { key: 'org',      label: 'Org' },
      { key: 'priority', label: 'Priority', badge: true },
      { key: 'pillar',   label: 'Pillar' },
      { key: 'atlbtl',   label: 'ATL/BTL' },
    ],
  },
  programs: {
    title: 'Programs', color: C.blue,
    columns: [
      { key: 'name',     label: 'Program',  bold: true },
      { key: 'status',   label: 'Status',   badge: true },
      { key: 'priority', label: 'Priority', badge: true },
      { key: 'sponsor',  label: 'Sponsor' },
    ],
  },
  msc: {
    title: 'MSC Capabilities', color: '#0891b2',
    columns: [
      { key: 'name',   label: 'Capability', bold: true },
      { key: 'status', label: 'Status',     badge: true },
      { key: 'org',    label: 'Source Org' },
      { key: 'stage',  label: 'Stage',      badge: true },
      { key: 'size',   label: 'Size' },
    ],
  },
  'beacon-epics': {
    title: 'Beacon Jira Epics', color: '#0891b2',
    columns: [
      { key: 'jiraKey',    label: 'Key',      mono: true },
      { key: 'name',       label: 'Epic',     bold: true },
      { key: 'status',     label: 'Status',   badge: true },
      { key: 'priority',   label: 'Priority', badge: true },
      { key: 'assignee',   label: 'Assignee' },
      { key: 'targetDate', label: 'Target',   date: true },
    ],
  },
  'lighthouse-actions': {
    title: 'Lighthouse Actions', color: '#7c3aed',
    columns: [
      { key: 'name',     label: 'Action',   bold: true },
      { key: 'status',   label: 'Status',   badge: true },
      { key: 'priority', label: 'Priority', badge: true },
      { key: 'owner',    label: 'Owner' },
      { key: 'dueDate',  label: 'Due',      date: true },
    ],
  },
  deps: {
    title: 'Cross-Org Dependencies', color: C.amber,
    columns: [
      { key: 'name',         label: 'Dependency',    bold: true },
      { key: 'lifecycle',    label: 'Lifecycle',      badge: true },
      { key: 'priority',     label: 'Priority',       badge: true },
      { key: 'requestingOrg',label: 'Requesting Org' },
      { key: 'resolvingOrg', label: 'Resolving Org' },
      { key: 'targetDate',   label: 'Target',         date: true },
    ],
  },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'On Track':    { bg: '#dcfce7', fg: '#16a34a' },
  'At Risk':     { bg: '#fef9c3', fg: '#a16207' },
  'Off Track':   { bg: '#fee2e2', fg: '#dc2626' },
  'Complete':    { bg: '#dbeafe', fg: '#1d4ed8' },
  'Approved':    { bg: '#f3e8ff', fg: '#7c3aed' },
  'In Progress': { bg: '#fff7ed', fg: '#c2410c' },
  'In Flight':   { bg: '#fff7ed', fg: '#c2410c' },
  'Not Started': { bg: '#f1f5f9', fg: '#475569' },
  'Blocked':     { bg: '#fee2e2', fg: '#dc2626' },
  'Declared':    { bg: '#f1f5f9', fg: '#64748b' },
  'Routed':      { bg: '#ede9fe', fg: '#6d28d9' },
  'Acknowledged':{ bg: '#eff6ff', fg: '#1d4ed8' },
  'Resolved':    { bg: '#dcfce7', fg: '#16a34a' },
  'Confirmed':   { bg: '#dbeafe', fg: '#1d4ed8' },
  'High':        { bg: '#fee2e2', fg: '#dc2626' },
  'Critical':    { bg: '#fce7f3', fg: '#9d174d' },
  'Medium':      { bg: '#fef9c3', fg: '#a16207' },
  'Low':         { bg: '#f1f5f9', fg: '#475569' },
  'P1':          { bg: '#fee2e2', fg: '#dc2626' },
  'ATL':         { bg: '#dbeafe', fg: '#1d4ed8' },
  'BTL':         { bg: '#f1f5f9', fg: '#475569' },
  'Discover':    { bg: '#ede9fe', fg: '#6d28d9' },
  'Define':      { bg: '#fef9c3', fg: '#a16207' },
  'Deploy':      { bg: '#dcfce7', fg: '#16a34a' },
  'Operate':     { bg: '#dbeafe', fg: '#1d4ed8' },
};

function fmtDate(s: unknown): string {
  if (!s) return '—';
  try { return new Date(String(s)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return String(s); }
}

export default function ArchitecturePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [active, setActive] = useState<NodeId | null>('l1');
  const [tab, setTab] = useState<'overview' | 'schema'>('overview');
  const [schemaCache, setSchemaCache] = useState<Partial<Record<NodeId, SchemaResponse>>>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<PreviewType | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRecord[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch('/api/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    if (!preview) return;
    setPreviewLoading(true);
    setPreviewData([]);
    fetch(`/api/preview?type=${preview}`)
      .then(r => r.json())
      .then(d => setPreviewData(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [preview]);

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

        {/* Bottom stat strip — click to preview */}
        {meta && (
          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            {([
              { label: 'Initiatives',       value: meta.l1.initiatives,        color: C.blue,     type: 'initiatives'        as PreviewType },
              { label: 'Programs',          value: meta.l1.programs,           color: C.blue,     type: 'programs'           as PreviewType },
              { label: 'MSC Capabilities',  value: meta.l1.mscCapabilities,    color: '#0891b2',  type: 'msc'                as PreviewType },
              { label: 'Beacon Epics',      value: meta.beacon.jiraEpics,      color: '#0891b2',  type: 'beacon-epics'       as PreviewType },
              { label: 'Lighthouse Actions',value: meta.lighthouse.actions,    color: '#7c3aed',  type: 'lighthouse-actions' as PreviewType },
              { label: 'Cross-Org Deps',    value: meta.switchboard.crossOrgDeps, color: C.amber, type: 'deps'              as PreviewType },
            ] as { label: string; value: number; color: string; type: PreviewType }[]).map(s => (
              <button key={s.label} onClick={() => setPreview(s.type)} style={{
                flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '12px 16px', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${s.color}18`; }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: s.color, marginTop: 3, opacity: 0.7, letterSpacing: '0.04em' }}>click to preview</div>
              </button>
            ))}
          </div>
        )}

        {/* Preview lightbox */}
        {preview && (
          <PreviewLightbox
            type={preview}
            data={previewData}
            loading={previewLoading}
            onClose={() => setPreview(null)}
          />
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
  const W = 680, H = 490;

  type NodeDef = { id: NodeId; x: number; y: number; w: number; h: number; label: string; sub: string; color: string };
  // Layer-cake grid:
  //   L1 band  y=0–110:   L1 node wide/centered
  //   L2 band  y=110–275: Beacon left | Future Org center (dashed) | Lighthouse right
  //   L3 band  y=275–490: Orchestrator left | Switchboard right
  const nodes: NodeDef[] = [
    { id: 'l1',           x: 100, y: 20,  w: 480, h: 70, label: 'L1 — Strategic Portfolio', sub: 'Executive visibility layer',  color: C.blue },
    { id: 'beacon',       x: 40,  y: 130, w: 180, h: 70, label: 'Beacon Shell',              sub: 'Tech org · Jira-linked',     color: '#0891b2' },
    { id: 'lighthouse',   x: 460, y: 130, w: 180, h: 70, label: 'Lighthouse',                sub: 'Finance / Strategy / HR',    color: '#7c3aed' },
    { id: 'orchestrator', x: 40,  y: 345, w: 200, h: 70, label: 'Orchestrator',              sub: 'Reference data layer · L3',  color: '#475569' },
    { id: 'switchboard',  x: 260, y: 345, w: 400, h: 70, label: 'L3 — Switchboard',          sub: 'Cross-org dependencies',     color: '#d97706' },
  ];

  const getCount = (id: NodeId): string => {
    if (!meta) return '…';
    switch (id) {
      case 'l1':           return `${meta.l1.initiatives} initiatives`;
      case 'beacon':       return `${meta.beacon.capabilities} capabilities`;
      case 'lighthouse':   return `${meta.lighthouse.capabilities} capabilities`;
      case 'switchboard':  return `${meta.switchboard.crossOrgDeps} deps`;
      case 'orchestrator': return 'reference data';
    }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted }}>
        System Architecture — click any base to explore
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', padding: 16 }}>
        <defs>
          <marker id="erd-arrow-blue"     markerWidth={8} markerHeight={8} refX={7} refY={3} orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={C.blue} />
          </marker>
          <marker id="erd-arrow-blue-rev" markerWidth={8} markerHeight={8} refX={1} refY={3} orient="auto-start-reverse">
            <path d="M0,0 L0,6 L8,3 z" fill={C.blue} />
          </marker>
          <marker id="erd-arrow-amber"    markerWidth={8} markerHeight={8} refX={7} refY={3} orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={C.amber} />
          </marker>
          <marker id="erd-arrow-slate"    markerWidth={6} markerHeight={6} refX={5} refY={2.5} orient="auto">
            <path d="M0,0 L0,5 L6,2.5 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* ── Layer band backgrounds ── */}
        <rect x={0} y={0}   width={W} height={110} fill="#eef4fc" />
        <rect x={0} y={110} width={W} height={165} fill="#fafafa" />
        <rect x={0} y={275} width={W} height={215} fill="#faf8f4" />
        <line x1={0} y1={110} x2={W} y2={110} stroke="#dde6f0" strokeWidth={1} />
        <line x1={0} y1={275} x2={W} y2={275} stroke="#e5e0d8" strokeWidth={1} />

        {/* ── Layer labels ── */}
        <text x={10} y={60}  fontSize={9} fontWeight={700} fill="#94a3b8" letterSpacing={1}>L1</text>
        <text x={10} y={168} fontSize={9} fontWeight={700} fill="#94a3b8" letterSpacing={1}>L2</text>
        <text x={10} y={383} fontSize={9} fontWeight={700} fill="#94a3b8" letterSpacing={1}>L3</text>

        {/* ── 1WS: Beacon ↔ L1 — bidirectional blue, straight vertical ── */}
        <path d="M 130,130 L 130,90"
          stroke={C.blue} strokeWidth={2} fill="none"
          markerStart="url(#erd-arrow-blue-rev)" markerEnd="url(#erd-arrow-blue)" />
        <text x={138} y={114} fontSize={8} fill={C.blue} fontStyle="italic" opacity={0.85}>1WS Sync</text>

        {/* ── 1WS: Lighthouse ↔ L1 — bidirectional blue, straight vertical ── */}
        <path d="M 550,130 L 550,90"
          stroke={C.blue} strokeWidth={2} fill="none"
          markerStart="url(#erd-arrow-blue-rev)" markerEnd="url(#erd-arrow-blue)" />
        <text x={558} y={114} fontSize={8} fill={C.blue} fontStyle="italic" opacity={0.85}>1WS Sync</text>

        {/* ── 2WS: Beacon → Switchboard — orange dashed, elbow via gap below L2 ── */}
        {/* Route: down from Beacon bottom, across above L3 nodes, into Switchboard left */}
        <path d="M 130,200 L 130,310 L 265,310 L 265,345"
          stroke={C.amber} strokeWidth={1.5} fill="none"
          strokeDasharray="5 4" markerEnd="url(#erd-arrow-amber)" opacity={0.85} />
        <text x={197} y={304} fontSize={8} fill={C.amber} textAnchor="middle" opacity={0.9}>2WS</text>

        {/* ── 2WS: Lighthouse → Switchboard — orange dashed, straight vertical ── */}
        <path d="M 550,200 L 550,345"
          stroke={C.amber} strokeWidth={1.5} fill="none"
          strokeDasharray="5 4" markerEnd="url(#erd-arrow-amber)" opacity={0.85} />
        <text x={558} y={272} fontSize={8} fill={C.amber} opacity={0.9}>2WS</text>

        {/* ── Orchestrator → Switchboard — gray dotted, short horizontal ── */}
        <path d="M 240,380 L 260,380"
          stroke="#94a3b8" strokeWidth={1.2} fill="none"
          strokeDasharray="3 3" markerEnd="url(#erd-arrow-slate)" opacity={0.6} />

        {/* ── Orchestrator → L1 — gray dotted, threads through Beacon/FutureOrg gap ── */}
        {/* Route: up from Orchestrator top, left jog to x=235 (30px gap between Beacon right=220 and FutureOrg left=250), straight up to L1 bottom */}
        <path d="M 140,345 L 140,295 L 235,295 L 235,90"
          stroke="#94a3b8" strokeWidth={1.2} fill="none"
          strokeDasharray="3 3" markerEnd="url(#erd-arrow-slate)" opacity={0.6} />

        {/* ── Future Org Base — dashed placeholder, no connections ── */}
        <g style={{ pointerEvents: 'none' }}>
          <rect x={250} y={130} width={180} height={70} rx={8}
            fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5}
            strokeDasharray="6 3" opacity={0.55} />
          <text x={340} y={158} textAnchor="middle"
            fontSize={11} fontWeight={600} fill="#94a3b8">Future Org Base</text>
          <text x={340} y={173} textAnchor="middle"
            fontSize={9} fill="#94a3b8">from Component Spine</text>
          <text x={340} y={187} textAnchor="middle"
            fontSize={8} fill="#b0bec5">Supply Chain · Design · …</text>
        </g>

        {/* ── Nodes ── */}
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
              <text x={n.x + n.w / 2} y={n.y + 24} textAnchor="middle"
                fontSize={12} fontWeight={700} fill={isActive ? '#fff' : '#1e293b'}>
                {n.label}
              </text>
              <text x={n.x + n.w / 2} y={n.y + 40} textAnchor="middle"
                fontSize={9} fill={isActive ? 'rgba(255,255,255,0.75)' : '#64748b'}>
                {n.sub}
              </text>
              <text x={n.x + n.w / 2} y={n.y + 56} textAnchor="middle"
                fontSize={9} fontWeight={600} fill={isActive ? 'rgba(255,255,255,0.9)' : n.color}>
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

// ── Preview Lightbox ──────────────────────────────────────────────────────────
function PreviewLightbox({ type, data, loading, onClose }: {
  type: PreviewType;
  data: PreviewRecord[];
  loading: boolean;
  onClose: () => void;
}) {
  const cfg = PREVIEW_CONFIG[type];

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const [search, setSearch] = useState('');
  const filtered = search
    ? data.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())))
    : data;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: 960, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          background: `linear-gradient(135deg, ${cfg.color}12, ${cfg.color}04)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cfg.title}</span>
            {!loading && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: cfg.color,
                background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                borderRadius: 5, padding: '2px 8px',
              }}>
                {filtered.length}{search ? ` of ${data.length}` : ''} records
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              autoFocus
              style={{
                fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 7,
                padding: '5px 10px', width: 180, color: C.text,
                background: C.card, outline: 'none',
              }}
            />
            <button onClick={onClose} style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 7,
              width: 30, height: 30, cursor: 'pointer', color: C.muted,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              <div style={{
                width: 20, height: 20, border: `2px solid ${cfg.color}44`,
                borderTopColor: cfg.color, borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block', marginBottom: 10,
              }} />
              <div>Loading live data…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              {search ? 'No records match this filter.' : 'No records found.'}
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                  {cfg.columns.map(col => (
                    <th key={col.key} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontWeight: 600, color: C.muted, fontSize: 11,
                      whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`,
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={String(row.id ?? i)} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = 'transparent'}
                  >
                    {cfg.columns.map(col => {
                      const val = row[col.key];
                      const str = val == null || val === '' ? '—' : String(val);
                      const sc = STATUS_COLORS[str];
                      return (
                        <td key={col.key} style={{ padding: '8px 14px', maxWidth: col.bold ? 280 : 180, verticalAlign: 'middle' }}>
                          {col.badge && sc ? (
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
                              fontSize: 11, fontWeight: 600,
                              background: sc.bg, color: sc.fg, whiteSpace: 'nowrap',
                            }}>{str}</span>
                          ) : col.mono ? (
                            <span style={{
                              fontFamily: 'monospace', fontSize: 11,
                              background: '#F1F5F9', color: C.deep,
                              padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                            }}>{str}</span>
                          ) : col.date ? (
                            <span style={{ color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(val)}</span>
                          ) : (
                            <span style={{
                              fontWeight: col.bold ? 600 : 400,
                              color: col.bold ? C.text : C.muted,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: 'block', whiteSpace: 'nowrap',
                            }}>{str}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.muted, background: '#F8FAFC', flexShrink: 0,
        }}>
          Live data · Esc to close
        </div>
      </div>
    </div>
  );
}
