// Unified catalog of all chart/diagram/infographic templates the user can pick.
// The underlying library (ECharts / Mermaid / AntV Infographic) is an
// implementation detail — the user never sees it. Categories are organized
// by PURPOSE (what the user wants to show), not by library.

import type {
  ChartEngine,
  EChartsConfig,
  MermaidConfig,
  InfographicConfig,
  InfographicTemplateCategory,
} from '@/types/chart'
import { ECHARTS_TEMPLATES } from '@/components/echarts-editor/echarts-templates'
import { MERMAID_TEMPLATES, type MermaidTemplateMeta } from '@/components/mermaid-editor/mermaid-templates'
import {
  TEMPLATE_REGISTRY,
  type TemplateMeta as InfographicTemplateMeta,
  CATEGORY_LABEL as INFOGRAPHIC_CATEGORY_LABEL,
  defaultDataForShape,
} from '@/components/infographic-editor/template-registry'

export type UnifiedCategory =
  | 'comparison' // 对比 / 比较
  | 'trend' // 趋势
  | 'composition' // 占比 / 构成
  | 'distribution' // 分布
  | 'flow' // 流程 / 步骤
  | 'structure' // 层级 / 结构
  | 'relationship' // 关系 / 网络
  | 'timeline' // 时间线
  | 'list' // 列表 / 要点
  | 'metric' // 指标 / 仪表

export const UNIFIED_CATEGORY_LABEL: Record<UnifiedCategory, string> = {
  comparison: 'Comparison',
  trend: 'Trend',
  composition: 'Composition',
  distribution: 'Distribution',
  flow: 'Flow & Steps',
  structure: 'Hierarchy',
  relationship: 'Relationship',
  timeline: 'Timeline',
  list: 'List',
  metric: 'Gauge',
}

export const UNIFIED_CATEGORY_ORDER: UnifiedCategory[] = [
  'comparison',
  'trend',
  'composition',
  'distribution',
  'flow',
  'structure',
  'relationship',
  'timeline',
  'list',
  'metric',
]

export const UNIFIED_CATEGORY_ICON: Record<UnifiedCategory, string> = {
  comparison: 'Columns2',
  trend: 'TrendingUp',
  composition: 'PieChart',
  distribution: 'ScatterChart',
  flow: 'Workflow',
  structure: 'Network',
  relationship: 'Share2',
  timeline: 'CalendarClock',
  list: 'List',
  metric: 'Gauge',
}

export interface UnifiedTemplate {
  /** Stable unique id across all libraries */
  id: string
  /** User-facing name (Chinese) */
  name: string
  /** Short description (Chinese) */
  description: string
  /** Primary purpose category */
  category: UnifiedCategory
  /** Additional categories this template belongs to (multi-category support) */
  categories: UnifiedCategory[]
  /** Which library powers this template (hidden from user) */
  engine: ChartEngine
  /** The library-specific template id (ECharts type, Mermaid type, or Infographic template name) */
  libraryType: string
  /** Lucide icon name */
  icon: string
  /** Tags for search */
  tags: string[]
}

// ---- Build unified entries from each library's template registry ----

// ECharts: map each template's type to a unified category
const ECHARTS_CATEGORY_MAP: Record<string, UnifiedCategory> = {
  bar: 'comparison',
  'bar-horizontal': 'comparison',
  'bar-stack': 'comparison',
  line: 'trend',
  'line-smooth': 'trend',
  area: 'trend',
  pie: 'composition',
  'pie-donut': 'composition',
  scatter: 'distribution',
  radar: 'comparison',
  funnel: 'composition',
  gauge: 'metric',
  heatmap: 'distribution',
  // NEW chart types
  candlestick: 'trend',
  boxplot: 'distribution',
  graph: 'relationship',
  sankey: 'composition',
  treemap: 'composition',
  sunburst: 'composition',
  parallel: 'distribution',
  themeRiver: 'trend',
}

const ECHARTS_ICON_MAP: Record<string, string> = {
  bar: 'BarChart3',
  'bar-horizontal': 'BarChartHorizontal',
  'bar-stack': 'BarChart3',
  line: 'LineChart',
  'line-smooth': 'LineChart',
  area: 'AreaChart',
  pie: 'PieChart',
  'pie-donut': 'Donut',
  scatter: 'ScatterChart',
  radar: 'Radar',
  funnel: 'Filter',
  gauge: 'Gauge',
  heatmap: 'Grid3x3',
  // NEW chart types
  candlestick: 'BarChart3',
  boxplot: 'BarChart3',
  graph: 'Share2',
  sankey: 'Workflow',
  treemap: 'Grid3x3',
  sunburst: 'Sun',
  parallel: 'AlignVerticalDistributeCenter',
  themeRiver: 'Waves',
}

export const ECHARTS_UNIFIED: UnifiedTemplate[] = ECHARTS_TEMPLATES.map((t) => {
  const cat = ECHARTS_CATEGORY_MAP[t.type] ?? 'comparison'
  return {
    id: `echarts:${t.id}`,
    name: t.name,
    description: t.description,
    category: cat,
    categories: [cat],
    engine: 'echarts',
    libraryType: t.id,
    icon: ECHARTS_ICON_MAP[t.type] ?? 'BarChart3',
    tags: t.tags ?? [],
  }
})

// Mermaid: map each diagram type to a unified category
const MERMAID_CATEGORY_MAP: Record<string, UnifiedCategory> = {
  flowchart: 'flow',
  sequence: 'flow',
  class: 'structure',
  state: 'flow',
  er: 'structure',
  gantt: 'timeline',
  journey: 'flow',
  mindmap: 'structure',
  pie: 'composition',
  gitgraph: 'flow',
  timeline: 'timeline',
}

// Multi-category map for mermaid templates
const MERMAID_EXTRA_CATEGORIES: Record<string, UnifiedCategory[]> = {
  timeline: ['timeline', 'flow'],
  gantt: ['timeline', 'flow'],
  state: ['flow', 'structure'],
  journey: ['flow', 'timeline'],
}

export const MERMAID_UNIFIED: UnifiedTemplate[] = MERMAID_TEMPLATES.map((t: MermaidTemplateMeta) => {
  const cat = MERMAID_CATEGORY_MAP[t.type] ?? 'flow'
  const extra = MERMAID_EXTRA_CATEGORIES[t.type] ?? []
  const cats = [cat, ...extra.filter(c => c !== cat)]
  return {
    id: `mermaid:${t.id}`,
    name: t.name,
    description: t.description,
    category: cat,
    categories: cats,
    engine: 'mermaid',
    libraryType: t.id,
    icon: t.icon,
    tags: [t.category, t.type],
  }
})

// Infographic: map each category to a unified category
const INFOGRAPHIC_CATEGORY_MAP: Record<InfographicTemplateCategory, UnifiedCategory> = {
  list: 'list',
  sequence: 'flow',
  compare: 'comparison',
  hierarchy: 'structure',
  relation: 'relationship',
  chart: 'composition',
  quadrant: 'comparison',
}

const INFOGRAPHIC_ICON_MAP: Partial<Record<string, string>> = {
  'list-row': 'Rows3',
  'list-grid': 'LayoutGrid',
  'list-column': 'Columns3',
  'list-pyramid': 'Triangle',
  'list-sector': 'PieChart',
  'list-waterfall': 'Waves',
  'list-zigzag': 'Spline',
  'sequence-timeline': 'GitCommitHorizontal',
  'sequence-steps': 'ListOrdered',
  'sequence-snake': 'Spline',
  'sequence-roadmap': 'Map',
  'sequence-circular': 'CircleDot',
  'sequence-pyramid': 'Triangle',
  'sequence-funnel': 'Filter',
  'sequence-interaction': 'ArrowRightLeft',
  'sequence-color-snake': 'Spline',
  'sequence-horizontal-zigzag': 'Spline',
  'sequence-zigzag': 'Spline',
  'sequence-ascending': 'TrendingUp',
  'sequence-cylinders': 'Database',
  'sequence-stairs': 'TrendingUp',
  'sequence-mountain': 'Mountain',
  'sequence-filter-mesh': 'Grid3x3',
  'sequence-circle-arrows': 'RefreshCw',
  'sequence-zigzag-pucks': 'Circle',
  'compare-binary': 'Columns2',
  'compare-hierarchy': 'Split',
  'compare-swot': 'Grid2x2',
  'compare-quadrant': 'Grid2x2',
  'hierarchy-tree': 'Network',
  'relation-network': 'Share2',
  'relation-circle': 'Circle',
  'relation-dagre': 'Workflow',
  'chart-pie': 'PieChart',
  'chart-column': 'BarChart3',
  'chart-bar': 'BarChartHorizontal',
  'chart-line': 'LineChart',
  'chart-wordcloud': 'Cloud',
  'quadrant': 'Grid2x2',
}

function infographicIcon(t: InfographicTemplateMeta): string {
  for (const [prefix, icon] of Object.entries(INFOGRAPHIC_ICON_MAP)) {
    if (t.id.startsWith(prefix)) return icon
  }
  return 'Square'
}

// Multi-category map for infographic templates by prefix
const INFOGRAPHIC_EXTRA_CATEGORIES: { prefix: string; cats: UnifiedCategory[] }[] = [
  { prefix: 'list-column', cats: ['timeline'] }, // vertical column lists are timeline-like
  { prefix: 'sequence-timeline', cats: ['timeline', 'flow'] },
  { prefix: 'sequence-roadmap', cats: ['timeline', 'flow'] },
  { prefix: 'sequence-steps', cats: ['flow', 'list'] },
  { prefix: 'sequence-snake', cats: ['flow'] },
  { prefix: 'sequence-funnel', cats: ['composition'] },
  { prefix: 'sequence-pyramid', cats: ['composition'] },
  { prefix: 'sequence-interaction', cats: ['flow', 'relationship'] },
  { prefix: 'compare-swot', cats: ['comparison', 'structure'] },
  { prefix: 'compare-quadrant', cats: ['comparison'] },
  { prefix: 'chart-pie', cats: ['composition'] },
  { prefix: 'chart-wordcloud', cats: ['composition', 'list'] },
  { prefix: 'relation-dagre', cats: ['flow', 'relationship'] },
  { prefix: 'relation-network', cats: ['relationship'] },
]

function getInfographicExtraCategories(templateId: string): UnifiedCategory[] {
  for (const { prefix, cats } of INFOGRAPHIC_EXTRA_CATEGORIES) {
    if (templateId.startsWith(prefix)) return cats
  }
  return []
}

export const INFOGRAPHIC_UNIFIED: UnifiedTemplate[] = TEMPLATE_REGISTRY.map((t) => {
  const cat = INFOGRAPHIC_CATEGORY_MAP[t.category] ?? 'list'
  const extra = getInfographicExtraCategories(t.id)
  const cats = [cat, ...extra.filter(c => c !== cat)]
  return {
    id: `infographic:${t.id}`,
    name: t.name,
    description: t.description,
    category: cat,
    categories: cats,
    engine: 'infographic',
    libraryType: t.id,
    icon: infographicIcon(t),
    tags: [INFOGRAPHIC_CATEGORY_LABEL[t.category], ...t.tags],
  }
})

// ---- Master catalog ----
export const UNIFIED_TEMPLATES: UnifiedTemplate[] = [
  ...ECHARTS_UNIFIED,
  ...MERMAID_UNIFIED,
  ...INFOGRAPHIC_UNIFIED,
]

export function groupUnifiedByCategory(): Record<UnifiedCategory, UnifiedTemplate[]> {
  const groups: Record<UnifiedCategory, UnifiedTemplate[]> = {
    comparison: [],
    trend: [],
    composition: [],
    distribution: [],
    flow: [],
    structure: [],
    relationship: [],
    timeline: [],
    list: [],
    metric: [],
  }
  // Use categories[] for multi-category support
  for (const t of UNIFIED_TEMPLATES) {
    for (const cat of t.categories) {
      groups[cat].push(t)
    }
  }
  return groups
}

export function findUnifiedTemplate(id: string): UnifiedTemplate | undefined {
  return UNIFIED_TEMPLATES.find((t) => t.id === id)
}

// ---- Default config builders per engine ----
export function defaultConfigForEngine(
  engine: ChartEngine,
  libraryType: string
): EChartsConfig | MermaidConfig | InfographicConfig {
  if (engine === 'echarts') {
    const tpl = ECHARTS_TEMPLATES.find((t) => t.id === libraryType)
    return tpl ? structuredClone(tpl.defaultConfig) : structuredClone(ECHARTS_TEMPLATES[0].defaultConfig)
  }
  if (engine === 'mermaid') {
    const tpl = MERMAID_TEMPLATES.find((t) => t.id === libraryType)
    return {
      type: tpl?.type ?? 'flowchart',
      code: tpl?.defaultCode ?? MERMAID_TEMPLATES[0].defaultCode,
      theme: 'default',
      background: '#ffffff',
    }
  }
  // infographic
  const tpl = TEMPLATE_REGISTRY.find((t) => t.id === libraryType) ?? TEMPLATE_REGISTRY[0]
  return {
    type: tpl.id,
    template: tpl.id,
    data: defaultDataForShape(tpl.dataShape),
    theme: 'light',
    background: '#ffffff',
    width: 900,
    height: 600,
  }
}
