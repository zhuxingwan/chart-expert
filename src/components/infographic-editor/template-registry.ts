// Curated subset of @antv/infographic's 276 built-in templates, organized by
// category with human-readable names & descriptions. The full registry is
// accessible at runtime via `getTemplates()`, but we surface a curated set
// here so non-technical users see a friendly, finite gallery.

import type { InfographicTemplateCategory } from '@/types/chart'

export interface TemplateMeta {
  id: string
  name: string
  description: string
  category: InfographicTemplateCategory
  /** Which data shape this template expects */
  dataShape: 'list' | 'hierarchy' | 'relation' | 'compare'
  tags: string[]
}

export const CATEGORY_LABEL: Record<InfographicTemplateCategory, string> = {
  list: 'List',
  sequence: 'Flow / Steps',
  compare: 'Comparison',
  hierarchy: 'Hierarchy / Tree',
  relation: 'Relationship',
  chart: 'Chart',
  quadrant: 'Quadrant',
}

export const CATEGORY_ORDER: InfographicTemplateCategory[] = [
  'list',
  'sequence',
  'compare',
  'hierarchy',
  'relation',
  'chart',
  'quadrant',
]

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // ---------- list ----------
  { id: 'list-row-simple-horizontal-arrow', name: 'Horizontal Arrow Steps', description: 'Horizontal steps connected by arrows', category: 'list', dataShape: 'list', tags: ['steps', 'horizontal', 'arrow'] },
  { id: 'list-row-horizontal-icon-line', name: 'Horizontal Icon Line', description: 'Horizontal icon list, linear connection', category: 'list', dataShape: 'list', tags: ['icon', 'horizontal'] },
  { id: 'list-row-circular-progress', name: 'Circular Progress', description: 'Horizontal row of circular progress items', category: 'list', dataShape: 'list', tags: ['progress', 'circular'] },
  { id: 'list-row-simple-illus', name: 'Horizontal Illustration', description: 'Horizontal illustration-style list', category: 'list', dataShape: 'list', tags: ['illustration', 'horizontal'] },
  { id: 'list-grid-simple', name: 'Grid Simple', description: 'Grid layout of minimal cards', category: 'list', dataShape: 'list', tags: ['grid', 'simple'] },
  { id: 'list-grid-compact-card', name: 'Grid Compact Card', description: 'Grid layout of compact cards', category: 'list', dataShape: 'list', tags: ['grid', 'card'] },
  { id: 'list-grid-badge-card', name: 'Grid Badge Card', description: 'Grid cards with badges', category: 'list', dataShape: 'list', tags: ['grid', 'badge'] },
  { id: 'list-grid-progress-card', name: 'Grid Progress Card', description: 'Grid cards with progress bars', category: 'list', dataShape: 'list', tags: ['grid', 'progress'] },
  { id: 'list-grid-circular-progress', name: 'Grid Circular Progress', description: 'Grid layout of circular progress', category: 'list', dataShape: 'list', tags: ['grid', 'circular'] },
  { id: 'list-grid-ribbon-card', name: 'Grid Ribbon Card', description: 'Grid cards with ribbon decoration', category: 'list', dataShape: 'list', tags: ['grid', 'ribbon'] },
  { id: 'list-grid-candy-card-lite', name: 'Candy Card', description: 'Candy-style grid cards', category: 'list', dataShape: 'list', tags: ['candy', 'cute'] },
  { id: 'list-grid-done-list', name: 'Grid Checklist', description: 'Checklist-style grid list', category: 'list', dataShape: 'list', tags: ['checklist', 'todo'] },
  { id: 'list-grid-horizontal-icon-arrow', name: 'Grid Horizontal Arrow', description: 'Grid layout with horizontal arrow connection', category: 'list', dataShape: 'list', tags: ['grid', 'arrow'] },
  { id: 'list-column-done-list', name: 'Vertical Checklist', description: 'Vertical checklist', category: 'list', dataShape: 'list', tags: ['vertical', 'checklist'] },
  { id: 'list-column-simple-vertical-arrow', name: 'Vertical Arrow', description: 'Vertical arrow connection', category: 'list', dataShape: 'list', tags: ['vertical', 'arrow'] },
  { id: 'list-column-vertical-icon-arrow', name: 'Vertical Icon Arrow', description: 'Vertical arrow list with icons', category: 'list', dataShape: 'list', tags: ['vertical', 'icon'] },
  { id: 'list-pyramid-badge-card', name: 'Pyramid Badge Card', description: 'Pyramid layout with badge cards', category: 'list', dataShape: 'list', tags: ['pyramid', 'badge'] },
  { id: 'list-pyramid-compact-card', name: 'Pyramid Compact Card', description: 'Pyramid layout with compact cards', category: 'list', dataShape: 'list', tags: ['pyramid'] },
  { id: 'list-pyramid-rounded-rect-node', name: 'Pyramid Rounded', description: 'Pyramid layout with rounded nodes', category: 'list', dataShape: 'list', tags: ['pyramid', 'rounded'] },
  { id: 'list-sector-simple', name: 'Sector Simple', description: 'Sector layout, minimal items', category: 'list', dataShape: 'list', tags: ['sector'] },
  { id: 'list-sector-plain-text', name: 'Sector Text', description: 'Sector layout, plain text', category: 'list', dataShape: 'list', tags: ['sector', 'text'] },
  { id: 'list-sector-half-plain-text', name: 'Half Sector', description: 'Half-sector (semi-circle) layout', category: 'list', dataShape: 'list', tags: ['sector', 'half'] },
  { id: 'list-waterfall-compact-card', name: 'Waterfall Compact Card', description: 'Waterfall layout with compact cards', category: 'list', dataShape: 'list', tags: ['waterfall'] },
  { id: 'list-waterfall-badge-card', name: 'Waterfall Badge Card', description: 'Waterfall layout with badge cards', category: 'list', dataShape: 'list', tags: ['waterfall', 'badge'] },
  { id: 'list-zigzag-up-compact-card', name: 'Upward Zigzag Card', description: 'Zigzag upward compact cards', category: 'list', dataShape: 'list', tags: ['zigzag', 'up'] },
  { id: 'list-zigzag-up-simple', name: 'Upward Zigzag Simple', description: 'Zigzag upward simple', category: 'list', dataShape: 'list', tags: ['zigzag'] },
  { id: 'list-zigzag-down-compact-card', name: 'Downward Zigzag Card', description: 'Zigzag downward compact cards', category: 'list', dataShape: 'list', tags: ['zigzag', 'down'] },
  { id: 'list-zigzag-down-simple', name: 'Downward Zigzag Simple', description: 'Zigzag downward simple', category: 'list', dataShape: 'list', tags: ['zigzag'] },

  // ---------- sequence ----------
  { id: 'sequence-timeline-simple', name: 'Timeline Simple', description: 'Horizontal timeline, minimal style', category: 'sequence', dataShape: 'list', tags: ['timeline', 'horizontal'] },
  { id: 'sequence-timeline-plain-text', name: 'Timeline Text', description: 'Horizontal timeline, plain text', category: 'sequence', dataShape: 'list', tags: ['timeline', 'text'] },
  { id: 'sequence-timeline-done-list', name: 'Timeline Checklist', description: 'Timeline checklist style', category: 'sequence', dataShape: 'list', tags: ['timeline', 'checklist'] },
  { id: 'sequence-timeline-rounded-rect-node', name: 'Timeline Rounded', description: 'Timeline with rounded nodes', category: 'sequence', dataShape: 'list', tags: ['timeline', 'rounded'] },
  { id: 'sequence-timeline-simple-illus', name: 'Timeline Illustration', description: 'Timeline illustration style', category: 'sequence', dataShape: 'list', tags: ['timeline', 'illustration'] },
  { id: 'sequence-steps-simple', name: 'Steps Simple', description: 'Simple step arrangement', category: 'sequence', dataShape: 'list', tags: ['steps'] },
  { id: 'sequence-steps-badge-card', name: 'Steps Badge Card', description: 'Step cards with badges', category: 'sequence', dataShape: 'list', tags: ['steps', 'badge'] },
  { id: 'sequence-steps-simple-illus', name: 'Steps Illustration', description: 'Illustration-style steps', category: 'sequence', dataShape: 'list', tags: ['steps', 'illustration'] },
  { id: 'sequence-snake-steps-compact-card', name: 'Snake Compact Card', description: 'Snake-arranged compact cards', category: 'sequence', dataShape: 'list', tags: ['snake'] },
  { id: 'sequence-snake-steps-pill-badge', name: 'Snake Pill Badge', description: 'Snake-arranged pill badges', category: 'sequence', dataShape: 'list', tags: ['snake', 'pill'] },
  { id: 'sequence-snake-steps-simple', name: 'Snake Simple', description: 'Snake-arranged simple', category: 'sequence', dataShape: 'list', tags: ['snake'] },
  { id: 'sequence-snake-steps-simple-illus', name: 'Snake Illustration', description: 'Snake-arranged illustration', category: 'sequence', dataShape: 'list', tags: ['snake', 'illustration'] },
  { id: 'sequence-color-snake-steps-horizontal-icon-line', name: 'Colorful Snake Line', description: 'Colorful snake with icon connection', category: 'sequence', dataShape: 'list', tags: ['snake', 'colorful'] },
  { id: 'sequence-color-snake-steps-simple-illus', name: 'Colorful Snake Illustration', description: 'Colorful snake illustration style', category: 'sequence', dataShape: 'list', tags: ['snake', 'illustration', 'colorful'] },
  { id: 'sequence-roadmap-vertical-plain-text', name: 'Vertical Roadmap', description: 'Vertical roadmap, plain text', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'vertical'] },
  { id: 'sequence-roadmap-vertical-simple', name: 'Vertical Roadmap Simple', description: 'Vertical roadmap, minimal', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'vertical'] },
  { id: 'sequence-roadmap-vertical-badge-card', name: 'Vertical Roadmap Badge', description: 'Vertical roadmap, badge cards', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'badge'] },
  { id: 'sequence-roadmap-vertical-pill-badge', name: 'Vertical Roadmap Pill', description: 'Vertical roadmap, pill badges', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'pill'] },
  { id: 'sequence-roadmap-vertical-quarter-circular', name: 'Vertical Roadmap Quarter Circle', description: 'Vertical roadmap, quarter-circle nodes', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'arc'] },
  { id: 'sequence-roadmap-vertical-quarter-simple-card', name: 'Vertical Roadmap Quarter Card', description: 'Vertical roadmap, quarter simple card', category: 'sequence', dataShape: 'list', tags: ['roadmap'] },
  { id: 'sequence-roadmap-vertical-underline-text', name: 'Vertical Roadmap Underline', description: 'Vertical roadmap, underline text', category: 'sequence', dataShape: 'list', tags: ['roadmap', 'underline'] },
  { id: 'sequence-horizontal-zigzag-simple', name: 'Horizontal Zigzag Simple', description: 'Horizontal zigzag simple', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'horizontal'] },
  { id: 'sequence-horizontal-zigzag-plain-text', name: 'Horizontal Zigzag Text', description: 'Horizontal zigzag plain text', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'horizontal'] },
  { id: 'sequence-horizontal-zigzag-simple-illus', name: 'Horizontal Zigzag Illustration', description: 'Horizontal zigzag illustration', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'illustration'] },
  { id: 'sequence-horizontal-zigzag-simple-horizontal-arrow', name: 'Horizontal Zigzag Arrow', description: 'Horizontal zigzag with arrows', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'arrow'] },
  { id: 'sequence-horizontal-zigzag-horizontal-icon-line', name: 'Horizontal Zigzag Icon', description: 'Horizontal zigzag with icon line', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'icon'] },
  { id: 'sequence-horizontal-zigzag-underline-text', name: 'Horizontal Zigzag Underline', description: 'Horizontal zigzag underline', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'underline'] },
  { id: 'sequence-zigzag-steps-underline-text', name: 'Zigzag Steps Underline', description: 'Zigzag steps underline text', category: 'sequence', dataShape: 'list', tags: ['zigzag', 'underline'] },
  { id: 'sequence-circle-arrows-indexed-card', name: 'Circular Arrow Card', description: 'Circular arrows with indexed cards', category: 'sequence', dataShape: 'list', tags: ['circular', 'arrow'] },
  { id: 'sequence-zigzag-pucks-3d-simple', name: '3D Zigzag Puck', description: '3D zigzag puck simple', category: 'sequence', dataShape: 'list', tags: ['3d', 'zigzag'] },
  { id: 'sequence-zigzag-pucks-3d-underline-text', name: '3D Zigzag Underline', description: '3D zigzag puck underline', category: 'sequence', dataShape: 'list', tags: ['3d', 'underline'] },
  { id: 'sequence-zigzag-pucks-3d-indexed-card', name: '3D Zigzag Index', description: '3D zigzag puck index card', category: 'sequence', dataShape: 'list', tags: ['3d', 'index'] },
  { id: 'sequence-ascending-stairs-3d-simple', name: '3D Stairs', description: '3D ascending stairs simple', category: 'sequence', dataShape: 'list', tags: ['3d', 'stairs'] },
  { id: 'sequence-ascending-stairs-3d-underline-text', name: '3D Stairs Underline', description: '3D ascending stairs underline', category: 'sequence', dataShape: 'list', tags: ['3d', 'underline'] },
  { id: 'sequence-ascending-steps', name: 'Ascending Steps', description: 'L-shaped ascending steps', category: 'sequence', dataShape: 'list', tags: ['stairs', 'ascending'] },
  { id: 'sequence-cylinders-3d-simple', name: '3D Cylinders', description: '3D cylinders simple', category: 'sequence', dataShape: 'list', tags: ['3d', 'cylinder'] },
  { id: 'sequence-circular-simple', name: 'Circular Simple', description: 'Circular arrangement simple', category: 'sequence', dataShape: 'list', tags: ['circular'] },
  { id: 'sequence-circular-underline-text', name: 'Circular Underline', description: 'Circular arrangement underline', category: 'sequence', dataShape: 'list', tags: ['circular', 'underline'] },
  { id: 'sequence-filter-mesh-simple', name: 'Mesh Simple', description: 'Mesh arrangement simple', category: 'sequence', dataShape: 'list', tags: ['mesh'] },
  { id: 'sequence-filter-mesh-underline-text', name: 'Mesh Underline', description: 'Mesh arrangement underline', category: 'sequence', dataShape: 'list', tags: ['mesh', 'underline'] },
  { id: 'sequence-mountain-underline-text', name: 'Mountain Underline', description: 'Mountain arrangement underline', category: 'sequence', dataShape: 'list', tags: ['mountain'] },
  { id: 'sequence-pyramid-simple', name: 'Pyramid', description: 'Pyramid steps', category: 'sequence', dataShape: 'list', tags: ['pyramid'] },
  { id: 'sequence-funnel-simple', name: 'Funnel', description: 'Funnel steps', category: 'sequence', dataShape: 'list', tags: ['funnel'] },
  { id: 'sequence-stairs-front-simple', name: 'Front Stairs Simple', description: 'Front-facing stairs simple', category: 'sequence', dataShape: 'list', tags: ['stairs'] },
  { id: 'sequence-stairs-front-compact-card', name: 'Front Stairs Compact', description: 'Front-facing stairs compact card', category: 'sequence', dataShape: 'list', tags: ['stairs'] },
  { id: 'sequence-stairs-front-pill-badge', name: 'Front Stairs Pill', description: 'Front-facing stairs pill badge', category: 'sequence', dataShape: 'list', tags: ['stairs', 'pill'] },
  { id: 'sequence-interaction-default-badge-card', name: 'Interaction Badge Card', description: 'Interaction sequence badge card', category: 'sequence', dataShape: 'list', tags: ['interaction', 'sequence'] },
  { id: 'sequence-interaction-default-compact-card', name: 'Interaction Compact Card', description: 'Interaction sequence compact card', category: 'sequence', dataShape: 'list', tags: ['interaction', 'sequence'] },
  { id: 'sequence-interaction-default-capsule-item', name: 'Interaction Capsule', description: 'Interaction sequence capsule item', category: 'sequence', dataShape: 'list', tags: ['interaction', 'capsule'] },
  { id: 'sequence-interaction-default-rounded-rect-node', name: 'Interaction Rounded', description: 'Interaction sequence rounded node', category: 'sequence', dataShape: 'list', tags: ['interaction', 'rounded'] },
  { id: 'sequence-interaction-compact-capsule-item', name: 'Compact Interaction Capsule', description: 'Compact interaction capsule', category: 'sequence', dataShape: 'list', tags: ['interaction', 'compact'] },
  { id: 'sequence-interaction-wide-capsule-item', name: 'Wide Interaction Capsule', description: 'Wide interaction capsule', category: 'sequence', dataShape: 'list', tags: ['interaction', 'wide'] },
  { id: 'sequence-interaction-default-dashed-capsule-item', name: 'Dashed Interaction Capsule', description: 'Dashed interaction capsule', category: 'sequence', dataShape: 'list', tags: ['interaction', 'dashed'] },
  { id: 'sequence-interaction-default-animated-capsule-item', name: 'Animated Interaction Capsule', description: 'Animated interaction capsule', category: 'sequence', dataShape: 'list', tags: ['interaction', 'animated'] },

  // ---------- compare ----------
  { id: 'compare-binary-horizontal-simple-vs', name: 'VS Simple', description: 'Left-right VS comparison', category: 'compare', dataShape: 'compare', tags: ['compare', 'vs'] },
  { id: 'compare-binary-horizontal-compact-card-vs', name: 'VS Compact', description: 'VS comparison compact card', category: 'compare', dataShape: 'compare', tags: ['compare', 'vs', 'compact'] },
  { id: 'compare-binary-horizontal-badge-card-vs', name: 'VS Badge', description: 'VS comparison badge card', category: 'compare', dataShape: 'compare', tags: ['compare', 'vs', 'badge'] },
  { id: 'compare-binary-horizontal-underline-text-vs', name: 'VS Underline', description: 'VS comparison underline', category: 'compare', dataShape: 'compare', tags: ['compare', 'vs', 'underline'] },
  { id: 'compare-binary-horizontal-simple-arrow', name: 'Arrow Compare Simple', description: 'Arrow comparison simple', category: 'compare', dataShape: 'compare', tags: ['compare', 'arrow'] },
  { id: 'compare-binary-horizontal-compact-card-arrow', name: 'Arrow Compare Compact', description: 'Arrow comparison compact card', category: 'compare', dataShape: 'compare', tags: ['compare', 'arrow', 'compact'] },
  { id: 'compare-binary-horizontal-simple-fold', name: 'Fold Compare', description: 'Folded comparison', category: 'compare', dataShape: 'compare', tags: ['compare', 'fold'] },
  { id: 'compare-hierarchy-row-letter-card-compact-card', name: 'Row Letter Card', description: 'Row hierarchy letter card comparison', category: 'compare', dataShape: 'compare', tags: ['compare', 'hierarchy'] },
  { id: 'compare-hierarchy-row-letter-card-rounded-rect-node', name: 'Row Letter Rounded', description: 'Row hierarchy letter card rounded', category: 'compare', dataShape: 'compare', tags: ['compare', 'rounded'] },
  { id: 'compare-hierarchy-left-right-circle-node-pill-badge', name: 'Left-Right Circle Pill', description: 'Left-right circle node pill badge', category: 'compare', dataShape: 'compare', tags: ['compare', 'left-right'] },
  { id: 'compare-hierarchy-left-right-circle-node-plain-text', name: 'Left-Right Circle Text', description: 'Left-right circle node plain text', category: 'compare', dataShape: 'compare', tags: ['compare', 'left-right'] },
  { id: 'compare-swot', name: 'SWOT Analysis', description: 'SWOT four-quadrant analysis', category: 'compare', dataShape: 'compare', tags: ['swot', 'quadrant'] },
  { id: 'compare-quadrant-quarter-simple-card', name: 'Quadrant Card', description: 'Four-quadrant simple card', category: 'compare', dataShape: 'compare', tags: ['quadrant'] },
  { id: 'compare-quadrant-quarter-circular', name: 'Quadrant Arc', description: 'Four-quadrant arc', category: 'compare', dataShape: 'compare', tags: ['quadrant', 'arc'] },
  { id: 'compare-quadrant-simple-illus', name: 'Quadrant Illustration', description: 'Four-quadrant illustration', category: 'compare', dataShape: 'compare', tags: ['quadrant', 'illustration'] },

  // ---------- hierarchy ----------
  { id: 'hierarchy-tree-tech-style-capsule-item', name: 'Tech Tree Capsule', description: 'Tech-style tree capsule', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'tech'] },
  { id: 'hierarchy-tree-tech-style-compact-card', name: 'Tech Tree Compact', description: 'Tech-style tree compact card', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'tech', 'compact'] },
  { id: 'hierarchy-tree-tech-style-rounded-rect-node', name: 'Tech Tree Rounded', description: 'Tech-style tree rounded', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'tech', 'rounded'] },
  { id: 'hierarchy-tree-tech-style-badge-card', name: 'Tech Tree Badge', description: 'Tech-style tree badge card', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'tech', 'badge'] },
  { id: 'hierarchy-tree-dashed-line-capsule-item', name: 'Dashed Tree Capsule', description: 'Dashed-line tree capsule', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'dashed'] },
  { id: 'hierarchy-tree-distributed-origin-capsule-item', name: 'Distributed Tree', description: 'Distributed tree capsule', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'distributed'] },
  { id: 'hierarchy-tree-curved-line-capsule-item', name: 'Curved Tree', description: 'Curved-line tree capsule', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'curved'] },
  { id: 'hierarchy-tree-dashed-arrow-capsule-item', name: 'Dashed Arrow Tree', description: 'Dashed-arrow tree', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'arrow'] },
  { id: 'hierarchy-tree-lr-tech-style-capsule-item', name: 'Left-Right Tree', description: 'Left-right layout tech tree', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'left-right'] },
  { id: 'hierarchy-tree-lr-dashed-line-capsule-item', name: 'Left-Right Dashed Tree', description: 'Left-right layout dashed tree', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'left-right', 'dashed'] },
  { id: 'hierarchy-tree-bt-tech-style-capsule-item', name: 'Bottom-Up Tree', description: 'Bottom-up layout tech tree', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'bottom-up'] },
  { id: 'hierarchy-tree-rl-distributed-origin-capsule-item', name: 'Right-Distributed Tree', description: 'Right-distributed tree', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'right'] },
  { id: 'hierarchy-tree-curved-line-badge-card', name: 'Curved Tree Badge', description: 'Curved-line tree badge card', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'curved', 'badge'] },
  { id: 'hierarchy-tree-curved-line-compact-card', name: 'Curved Tree Compact', description: 'Curved-line tree compact card', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'curved', 'compact'] },
  { id: 'hierarchy-tree-curved-line-rounded-rect-node', name: 'Curved Tree Rounded', description: 'Curved-line tree rounded', category: 'hierarchy', dataShape: 'hierarchy', tags: ['tree', 'curved', 'rounded'] },

  // ---------- relation ----------
  { id: 'relation-network-simple-circle-node', name: 'Network Circle', description: 'Network graph with circle nodes', category: 'relation', dataShape: 'relation', tags: ['network', 'circle'] },
  { id: 'relation-network-icon-badge', name: 'Network Icon Badge', description: 'Network graph with icon badges', category: 'relation', dataShape: 'relation', tags: ['network', 'icon'] },
  { id: 'relation-circle-circular-progress', name: 'Circular Progress Relation', description: 'Circular progress relation', category: 'relation', dataShape: 'relation', tags: ['circular', 'progress'] },
  { id: 'relation-circle-icon-badge', name: 'Circular Icon Badge', description: 'Circular layout icon badge', category: 'relation', dataShape: 'relation', tags: ['circular', 'icon'] },
  { id: 'relation-dagre-flow-tb-simple-circle-node', name: 'Vertical Flow', description: 'Vertical Dagre flow', category: 'relation', dataShape: 'relation', tags: ['dagre', 'vertical'] },
  { id: 'relation-dagre-flow-tb-compact-card', name: 'Vertical Flow Compact', description: 'Vertical Dagre compact card', category: 'relation', dataShape: 'relation', tags: ['dagre', 'vertical', 'compact'] },
  { id: 'relation-dagre-flow-tb-badge-card', name: 'Vertical Flow Badge', description: 'Vertical Dagre badge card', category: 'relation', dataShape: 'relation', tags: ['dagre', 'vertical', 'badge'] },
  { id: 'relation-dagre-flow-lr-simple-circle-node', name: 'Horizontal Flow', description: 'Horizontal Dagre flow', category: 'relation', dataShape: 'relation', tags: ['dagre', 'horizontal'] },
  { id: 'relation-dagre-flow-lr-compact-card', name: 'Horizontal Flow Compact', description: 'Horizontal Dagre compact card', category: 'relation', dataShape: 'relation', tags: ['dagre', 'horizontal', 'compact'] },
  { id: 'relation-dagre-flow-tb-animated-capsule', name: 'Vertical Animated Capsule', description: 'Vertical animated Dagre capsule', category: 'relation', dataShape: 'relation', tags: ['dagre', 'animated', 'capsule'] },
  { id: 'relation-dagre-flow-lr-animated-capsule', name: 'Horizontal Animated Capsule', description: 'Horizontal animated Dagre capsule', category: 'relation', dataShape: 'relation', tags: ['dagre', 'animated', 'capsule'] },

  // ---------- chart ----------
  { id: 'chart-pie-plain-text', name: 'Pie Text', description: 'Pie chart with text labels', category: 'chart', dataShape: 'list', tags: ['pie'] },
  { id: 'chart-pie-compact-card', name: 'Pie Compact Card', description: 'Pie chart compact card', category: 'chart', dataShape: 'list', tags: ['pie', 'compact'] },
  { id: 'chart-pie-pill-badge', name: 'Pie Pill Badge', description: 'Pie chart pill badge', category: 'chart', dataShape: 'list', tags: ['pie', 'pill'] },
  { id: 'chart-pie-donut-plain-text', name: 'Donut Text', description: 'Donut chart with text', category: 'chart', dataShape: 'list', tags: ['donut'] },
  { id: 'chart-pie-donut-compact-card', name: 'Donut Compact', description: 'Donut chart compact card', category: 'chart', dataShape: 'list', tags: ['donut', 'compact'] },
  { id: 'chart-pie-donut-pill-badge', name: 'Donut Pill Badge', description: 'Donut chart pill badge', category: 'chart', dataShape: 'list', tags: ['donut', 'pill'] },
  { id: 'chart-column-simple', name: 'Column Simple', description: 'Minimal column chart', category: 'chart', dataShape: 'list', tags: ['column'] },
  { id: 'chart-bar-plain-text', name: 'Bar Text', description: 'Bar chart with text', category: 'chart', dataShape: 'list', tags: ['bar'] },
  { id: 'chart-line-plain-text', name: 'Line Text', description: 'Line chart with text', category: 'chart', dataShape: 'list', tags: ['line'] },
  { id: 'chart-wordcloud', name: 'Word Cloud', description: 'Word cloud chart', category: 'chart', dataShape: 'list', tags: ['wordcloud'] },
  { id: 'chart-wordcloud-rotate', name: 'Rotated Word Cloud', description: 'Rotated word cloud', category: 'chart', dataShape: 'list', tags: ['wordcloud', 'rotate'] },

  // ---------- quadrant ----------
  { id: 'quadrant-quarter-simple-card', name: 'Quadrant Card', description: 'Four-quadrant simple card', category: 'quadrant', dataShape: 'compare', tags: ['quadrant'] },
  { id: 'quadrant-quarter-circular', name: 'Quadrant Arc', description: 'Four-quadrant arc', category: 'quadrant', dataShape: 'compare', tags: ['quadrant', 'arc'] },
  { id: 'quadrant-simple-illus', name: 'Quadrant Illustration', description: 'Four-quadrant illustration', category: 'quadrant', dataShape: 'compare', tags: ['quadrant', 'illustration'] },
]

/** Group templates by category for the gallery */
export function groupTemplatesByCategory() {
  const groups: Record<InfographicTemplateCategory, TemplateMeta[]> = {
    list: [],
    sequence: [],
    compare: [],
    hierarchy: [],
    relation: [],
    chart: [],
    quadrant: [],
  }
  for (const t of TEMPLATE_REGISTRY) groups[t.category].push(t)
  return groups
}

/** Default sample data per data shape, so a freshly-picked template isn't empty */
export function defaultDataForShape(
  shape: TemplateMeta['dataShape']
): import('@/types/chart').InfographicData {
  if (shape === 'relation') {
    return {
      title: { text: 'Team Structure', subtext: 'Key roles and connections' },
      nodes: [
        { id: 'n1', label: 'PM', group: 'Core' },
        { id: 'n2', label: 'Designer', group: 'Design' },
        { id: 'n3', label: 'Engineer', group: 'Dev' },
        { id: 'n4', label: 'QA', group: 'Dev' },
      ],
      edges: [
        { from: 'n1', to: 'n2', label: 'leads' },
        { from: 'n1', to: 'n3', label: 'leads' },
        { from: 'n3', to: 'n4', label: 'tests' },
      ],
    }
  }
  if (shape === 'hierarchy') {
    return {
      title: { text: 'Product Team', subtext: 'Organization overview' },
      lists: [
        {
          label: 'Product Lead',
          desc: 'Overall strategy',
          children: [
            { label: 'Design', desc: 'UI/UX & brand' },
            { label: 'Engineering', desc: 'Build & deploy', children: [{ label: 'Frontend' }, { label: 'Backend' }] },
          ],
        },
      ],
    }
  }
  if (shape === 'compare') {
    return {
      title: { text: 'Plan A vs Plan B', subtext: 'Feature comparison' },
      lists: [
        { label: 'Plan A', desc: 'Fast launch', children: [{ label: 'Quick setup' }, { label: 'Lower cost' }, { label: 'Limited scale' }] },
        { label: 'Plan B', desc: 'Full feature', children: [{ label: 'Scalable' }, { label: 'Custom design' }, { label: 'Higher cost' }] },
      ],
    }
  }
  // list / chart
  return {
    title: { text: 'Key Metrics', subtext: 'Q4 performance highlights' },
    lists: [
      { label: 'Revenue', desc: 'Total income', value: 92, icon: 'growth' },
      { label: 'Users', desc: 'Active monthly', value: 78, icon: 'user' },
      { label: 'Retention', desc: 'Monthly rate', value: 65, icon: 'repeat' },
      { label: 'NPS Score', desc: 'Customer rating', value: 54, icon: 'star' },
    ],
  }
}
