export const BASE_L1          = 'appCNBYNGcbSj7fNq';
export const BASE_BEACON      = 'appwkie9ju54wkfYT';
export const BASE_LIGHTHOUSE  = 'appy9LBctWK5O1lEb';
export const BASE_SWITCHBOARD = 'appEYNscRBWFAlGsT';
export const BASE_ORCHESTRATOR = 'appbcfht8yKGA4uQk';

export type NodeId = 'l1' | 'beacon' | 'lighthouse' | 'orchestrator' | 'switchboard';
export type SyncId = 'beacon-l1' | 'lighthouse-l1' | 'beacon-switchboard' | 'lighthouse-switchboard' | 'orchestrator-l1' | 'orchestrator-switchboard';
export type DisplayMode = 'summary' | 'records' | 'funnel';

export interface StepQuery {
  tableId: string;
  fields: string[];
  filterByFormula?: string;
  maxRecords?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
}

export interface StoryStep {
  id: number;
  act: string;
  title: string;
  narrative: string;
  baseId: string;
  query: StepQuery;
  highlightNodes: NodeId[];
  highlightSyncs: SyncId[];
  deepLink?: string;
  displayMode: DisplayMode;
  groupByField?: string;    // for funnel displayMode
  summaryFields?: string[]; // fields to aggregate for summary displayMode
}

export const STEPS: StoryStep[] = [
  // ── ACT I: Initiative Reporting ────────────────────────────────────────────
  {
    id: 1,
    act: 'Act I — Initiative Reporting',
    title: 'The Portfolio at a Glance',
    narrative:
      "This is the reporting layer built for Burton's WMT US-wide update — the single pane of glass that blends tech and non-tech programs across the entire enterprise. " +
      "One status vocabulary. One rollup view that leadership can actually trust. " +
      "Kim and Ashish drove the requirements. Ronny built the base. What you're seeing is live data from the Airtable base that powers the executive dashboard. " +
      "Whether initiatives originate top-down from Burton's team or bottom-up from each org during AOP, they converge here.",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl2ExbwxFOFpEtom',
      fields: ['Name', 'Status', 'Pillar', 'Priority', 'Source Org'],
      maxRecords: 150,
    },
    highlightNodes: ['l1'],
    highlightSyncs: [],
    deepLink: '/initiatives',
    displayMode: 'summary',
    groupByField: 'Status',
  },
  {
    id: 2,
    act: 'Act I — Initiative Reporting',
    title: 'Flagship Programs',
    narrative:
      "Behind the 130 initiatives are the ones that actually matter to the C-suite — Walmart+ expansion, GenAI Acceleration, Supply Chain Modernization. " +
      "Each one has a named pillar, a priority tier, and a source org. " +
      "The system distinguishes ATL from BTL and links directly to the enterprise priorities that drove each initiative into the portfolio.",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl2ExbwxFOFpEtom',
      fields: ['Name', 'Status', 'Pillar', 'Priority', 'Source Org', 'ATL/BTL', 'Enterprise Priorities'],
      filterByFormula: "NOT(OR({Name}=\"\", FIND(\"Initiative \", {Name})=1))",
      sort: [{ field: 'Priority', direction: 'asc' }],
      maxRecords: 20,
    },
    highlightNodes: ['l1'],
    highlightSyncs: [],
    deepLink: '/initiatives',
    displayMode: 'records',
  },
  {
    id: 3,
    act: 'Act I — Initiative Reporting',
    title: 'At-Risk Initiatives',
    narrative:
      "Four initiatives are currently At Risk — Global Supply Chain Finance Visibility, Last-Mile Delivery Optimization, Luminate Data Platform — Supplier Analytics, and Cross-Segment Financial Planning Consolidation. " +
      "Each one has a named product lead, a target Date to Green, and a written Plan to Green. " +
      "The conversation in the QBR isn't 'what's red' — it's 'here's the owner, here's the date, here's the plan.'",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl2ExbwxFOFpEtom',
      fields: ['Name', 'Status', 'Priority', 'Product Lead', 'Date to Green', 'Plan to Green'],
      filterByFormula: 'AND({Status}="At Risk", NOT(OR({Name}="", FIND("Initiative ", {Name})=1)))',
      maxRecords: 10,
    },
    highlightNodes: ['l1'],
    highlightSyncs: [],
    deepLink: '/initiatives',
    displayMode: 'records',
  },
  {
    id: 4,
    act: 'Act I — Initiative Reporting',
    title: 'Financial Picture',
    narrative:
      "Every initiative carries its financial story — projected annual revenue impact, cost savings, investment required, and ROI. " +
      "For the POC, these are entered directly by program leads on each initiative record — no separate spreadsheet, no reconciliation step. " +
      "When a lead updates their numbers, the executive view updates immediately. " +
      "Automated rollup from child bases is the V2 path; for the May 12 moment, the value is having one place where finance lives alongside status.",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl2ExbwxFOFpEtom',
      fields: ['Name', 'Status', 'Annual Revenue Impact', 'Annual Cost Savings', 'Investment Required', 'Projected ROI'],
      filterByFormula: 'NOT(OR({Name}="", FIND("Initiative ", {Name})=1))',
      maxRecords: 20,
    },
    highlightNodes: ['l1'],
    highlightSyncs: [],
    deepLink: '/initiatives',
    displayMode: 'records',
  },

  // ── ACT II: Capability Execution ───────────────────────────────────────────
  {
    id: 5,
    act: 'Act II — Capability Execution',
    title: 'Beacon — Tech Capabilities',
    narrative:
      "Beacon is the tech org's delivery layer. Every capability is mapped to Jira epics and tracked through product lifecycle stages: Discover → Define → Deploy → Operate. " +
      "When a capability's status changes here — from In Progress to Complete — that signal flows up to L1 automatically. " +
      "No status meeting required. " +
      "Beacon is also the template. The capability schema, the initiative sync, the dependency tables — all of this is packaged as a reusable Component Spine. Lighthouse was stood up from it. The next org follows the same pattern.",
    baseId: BASE_BEACON,
    query: {
      tableId: 'tbl0SrUcmmHaLAoja',
      fields: ['Capability Name', 'Status', 'Product Lifecycle Stage', 'Engineering Lead', 'Size', 'Primary Product'],
      maxRecords: 15,
    },
    highlightNodes: ['beacon', 'l1'],
    highlightSyncs: ['beacon-l1'],
    deepLink: `https://airtabledemo.com/${BASE_BEACON}`,
    displayMode: 'records',
  },
  {
    id: 6,
    act: 'Act II — Capability Execution',
    title: 'Lighthouse — Strategic Actions',
    narrative:
      "Lighthouse handles the non-tech side — finance, strategy, HR. Their capabilities are tracked as Actions with owners and due dates. " +
      "Same status vocabulary as Beacon. Same L1 rollup pattern. " +
      "The architecture ensures both orgs speak the same language at the portfolio level, even if their execution models look completely different.",
    baseId: BASE_LIGHTHOUSE,
    query: {
      tableId: 'tblASLUQOWprw6YgF',
      fields: ['Action Name', 'Status', 'Owner', 'Due Date', 'Priority'],
      maxRecords: 15,
    },
    highlightNodes: ['lighthouse', 'l1'],
    highlightSyncs: ['lighthouse-l1'],
    deepLink: `https://airtabledemo.com/${BASE_LIGHTHOUSE}`,
    displayMode: 'records',
  },
  {
    id: 7,
    act: 'Act II — Capability Execution',
    title: 'Capability Rollup to L1',
    narrative:
      "The Multi Source Capabilities table is where both orgs converge. Beacon capabilities and Lighthouse capabilities flow into a single unified view in L1. " +
      "Kim doesn't need to look at two separate bases. She sees one coherent capability dashboard with source org labels and status rolled up from the actual delivery teams. " +
      "This is the 1WS pattern — one-way sync from L2 to L1. " +
      "The same pattern scales to any number of org bases — Supply Chain, Design, HR — each with its own L2 instance, all rolling up into one L1 view.",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl0z89Mlv0BEKSnU',
      fields: ['Capability Name', 'Status', 'Source Org', 'Product Lifecycle Stage', 'Size'],
      maxRecords: 20,
    },
    highlightNodes: ['beacon', 'lighthouse', 'l1'],
    highlightSyncs: ['beacon-l1', 'lighthouse-l1'],
    deepLink: '/initiatives',
    displayMode: 'records',
  },

  // ── ACT III: Cross-Org Dependencies ────────────────────────────────────────
  {
    id: 8,
    act: 'Act III — Cross-Org Dependencies',
    title: 'The Dependency Layer',
    narrative:
      "When Beacon needs something from Lighthouse — or vice versa — the dependency gets flagged and escalated to Switchboard. " +
      "This is L3: the cross-org visibility layer. Every cross-org dependency has a requesting org, a resolving org, a priority, and a lifecycle stage. " +
      "No dependency falls through the cracks.",
    baseId: BASE_SWITCHBOARD,
    query: {
      tableId: 'tblEEq5HGYSbi87W1',
      fields: ['Dependency Name', 'Requesting Org', 'Resolving Org', 'Priority', 'Lifecycle'],
      maxRecords: 100,
    },
    highlightNodes: ['switchboard'],
    highlightSyncs: [],
    deepLink: '/dependencies',
    displayMode: 'funnel',
    groupByField: 'Lifecycle',
  },
  {
    id: 9,
    act: 'Act III — Cross-Org Dependencies',
    title: 'Critical & High Priority',
    narrative:
      "The highest-priority dependencies get elevated attention. Each one names the capability requesting and the capability that must resolve it. " +
      "Target resolution dates are tracked alongside the dependency description. " +
      "When these slip, the escalation path is built in — not a separate process, not a separate meeting.",
    baseId: BASE_SWITCHBOARD,
    query: {
      tableId: 'tblEEq5HGYSbi87W1',
      fields: ['Dependency Name', 'Requesting Org', 'Resolving Org', 'Priority', 'Lifecycle', 'Target Resolution Date'],
      filterByFormula: 'OR({Priority}="Critical", {Priority}="High")',
      maxRecords: 15,
    },
    highlightNodes: ['beacon', 'lighthouse', 'switchboard'],
    highlightSyncs: ['beacon-switchboard', 'lighthouse-switchboard'],
    deepLink: '/dependencies',
    displayMode: 'records',
  },
  {
    id: 10,
    act: 'Act III — Cross-Org Dependencies',
    title: 'Dependency Lifecycle Funnel',
    narrative:
      "The lifecycle funnel shows the full pipeline: Declared → Routed → Acknowledged → In Progress → Resolved. " +
      "This is the operational health view — how many deps are moving versus stuck at each stage. " +
      "Program leads can see exactly where the bottlenecks are without a status call.",
    baseId: BASE_SWITCHBOARD,
    query: {
      tableId: 'tblEEq5HGYSbi87W1',
      fields: ['Dependency Name', 'Priority', 'Lifecycle', 'Requesting Org', 'Resolving Org'],
      maxRecords: 100,
    },
    highlightNodes: ['switchboard'],
    highlightSyncs: ['beacon-switchboard', 'lighthouse-switchboard'],
    deepLink: '/dependencies',
    displayMode: 'funnel',
    groupByField: 'Lifecycle',
  },
  {
    id: 11,
    act: 'Act III — Cross-Org Dependencies',
    title: 'Active Resolution Work',
    narrative:
      "Active dependencies — Routed, Acknowledged, and In Progress — are the live work surface between orgs. " +
      "Resolution Notes capture what's been agreed. Target Resolution Dates create accountability without a meeting. " +
      "When a dep resolves, it closes in Switchboard and the upstream capabilities get unblocked automatically.",
    baseId: BASE_SWITCHBOARD,
    query: {
      tableId: 'tblEEq5HGYSbi87W1',
      fields: ['Dependency Name', 'Requesting Org', 'Resolving Org', 'Priority', 'Lifecycle', 'Target Resolution Date', 'Description'],
      filterByFormula: 'OR({Lifecycle}="In Progress", {Lifecycle}="Routed", {Lifecycle}="Acknowledged")',
      maxRecords: 15,
    },
    highlightNodes: ['switchboard'],
    highlightSyncs: ['beacon-switchboard', 'lighthouse-switchboard'],
    deepLink: '/dependencies',
    displayMode: 'records',
  },

  // ── ACT IV: Architecture ───────────────────────────────────────────────────
  {
    id: 12,
    act: 'Act IV — The Full System',
    title: 'Enterprise Airtable at Scale',
    narrative:
      "Five Airtable bases. One enterprise planning system. Built for the May 12 reporting moment — Burton's first WMT US-wide status view from a single base. " +
      "L1 for portfolio visibility across tech and non-tech. Beacon and Lighthouse for delivery execution at the org level. " +
      "Orchestrator at L3 is the shared reference layer — canonical people, teams, and products distributed across every org base. Switchboard routes and resolves cross-org dependencies. " +
      "Every sync is automated. The direction of any sync can be reversed to match the business process — top-down planning, bottom-up proposals, or both. Every status rolls up. Every dependency is tracked. " +
      "The 'Supply Chain · Design · HR …' slot in the diagram isn't hypothetical — it's the next org that runs Component Spine. Same schema, same sync config, plugged in in a day. " +
      "This is what Airtable looks like when it's the connective tissue for an enterprise.",
    baseId: BASE_L1,
    query: {
      tableId: 'tbl2ExbwxFOFpEtom',
      fields: ['Name', 'Status'],
      maxRecords: 150,
    },
    highlightNodes: ['l1', 'beacon', 'lighthouse', 'orchestrator', 'switchboard'],
    highlightSyncs: ['beacon-l1', 'lighthouse-l1', 'beacon-switchboard', 'lighthouse-switchboard', 'orchestrator-l1', 'orchestrator-switchboard'],
    deepLink: '/',
    displayMode: 'summary',
    groupByField: 'Status',
  },
];
