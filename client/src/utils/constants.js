export const SECTIONS = [
  { id: 1, name: 'Plastic Molding Division', code: 'PMD' },
  { id: 2, name: 'Material Component Division', code: 'MCD' },
  { id: 3, name: 'Battery Recycling & Alloying Unit', code: 'BRAU' },
  { id: 4, name: 'Grid Casting', code: 'GC' },
  { id: 5, name: 'LSO', code: 'LSO' },
  { id: 6, name: 'Pasting', code: 'PASTING' },
  { id: 7, name: 'C&D', code: 'CD' },
  { id: 8, name: 'Buffing / Plate Shop', code: 'BPS' },
  { id: 9, name: 'Cell Assembly', code: 'CA' },
  { id: 10, name: 'Small UPS', code: 'SUPS' },
  { id: 11, name: 'Big UPS', code: 'BUPS' },
  { id: 12, name: 'Formation (FSF)', code: 'FSF' },
  { id: 13, name: 'Battery Assembly', code: 'BA' },
];

export const MODULE_NAMES = [
  { key: '5s', label: '5S', icon: 'Star' },
  { key: 'am', label: 'Autonomous Maintenance', icon: 'Wrench' },
  { key: 'abnormalities', label: 'Abnormalities', icon: 'AlertTriangle' },
  { key: 'avinya', label: 'Avinya Observations', icon: 'Eye' },
  { key: 'kaizens', label: 'Kaizens', icon: 'Lightbulb' },
  { key: 'lean_projects', label: 'Lean Projects', icon: 'TrendingUp' },
  { key: 'process_std', label: 'Process Standardisation', icon: 'ClipboardCheck' },
  { key: 'iso', label: 'ISO Objectives', icon: 'Award' },
  { key: 'opportunities', label: 'Opportunities', icon: 'Rocket' },
  { key: 'high_impact', label: 'High Impact Projects', icon: 'Zap' },
];

export const ROLES = {
  admin: { label: 'Admin', color: 'amber' },
  section_user: { label: 'Section User', color: 'blue' },
  viewer: { label: 'Viewer', color: 'cyan' },
};

export const REPORT_STATUSES = {
  draft: { label: 'Draft', class: 'badge-draft' },
  submitted: { label: 'Submitted', class: 'badge-submitted' },
};

export const CAPA_STATUSES = ['Open', 'In Progress', 'Closed', 'Verified'];
export const ISO_STATUSES = ['On Track', 'At Risk', 'Behind', 'Achieved'];
export const LEAN_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const HI_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];
