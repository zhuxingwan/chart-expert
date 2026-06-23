// Shared type definitions for the chart-making tool

export type ChartEngine = 'echarts' | 'mermaid' | 'infographic'

export interface SavedChart {
  id: string
  title: string
  engine: ChartEngine
  type: string
  config: unknown
  thumbnail: string | null
  createdAt: number
  updatedAt: number
}

// ---- ECharts ----
export interface EChartsConfig {
  title: { text: string; subtext?: string }
  legend: boolean
  theme: string
  type: string // bar | line | pie | ...
  categories: string[]
  series_names: string[]
  series_data: number[][]
  stack: boolean
  smooth: boolean
  horizontal: boolean
  showLabel: boolean
  showToolbox: boolean
  // for pie / funnel / gauge
  single_series_data?: { name: string; value: number }[]
  // for radar
  radar_indicators?: { name: string; max: number }[]
  // for gauge
  gauge_value?: number
  gauge_max?: number
  // for scatter
  scatter_data?: [number, number][]
}

// ---- Mermaid ----
export interface MermaidConfig {
  type: string
  code: string
  theme: string
  background: string
}

// ---- AntV Infographic ----
// 276 built-in templates across 7 categories: compare/list/chart/relation/sequence/quadrant/hierarchy
// 3 themes: light / dark / hand-drawn
// Data shape depends on template's structure type:
//   - list/sequence/chart-pie/chart-bar/chart-line: { lists: [{label,desc,value,icon}] }
//   - hierarchy-tree/hierarchy-mindmap/hierarchy-structure: { lists: [{label,desc,children:[...]}] }
//   - relation-network/relation-circle/relation-dagre-flow: { nodes:[{id,label,group}], edges:[{from,to,label}] }
//   - compare-binary-horizontal/compare-hierarchy-*/compare-swot: { lists: [{label,children:[...]}, ...] }
//   - compare-quadrant/quadrant-*: { lists: [{label,children:[...]}, ...] } (4 quadrants)

export type InfographicTemplateCategory =
  | 'list'
  | 'sequence'
  | 'compare'
  | 'hierarchy'
  | 'relation'
  | 'chart'
  | 'quadrant'

export interface InfographicItem {
  label?: string
  desc?: string
  value?: number
  icon?: string
  illus?: string
  children?: InfographicItem[]
  [k: string]: unknown
}
export interface InfographicRelationNode {
  id: string
  label: string
  group?: string
  icon?: string
}
export interface InfographicRelationEdge {
  from: string
  to: string
  label?: string
  direction?: 'forward' | 'both' | 'none'
}
export interface InfographicData {
  title?: { text?: string; subtext?: string }
  lists?: InfographicItem[]
  nodes?: InfographicRelationNode[]
  edges?: InfographicRelationEdge[]
}
export interface InfographicConfig {
  type: string // template id, e.g. 'list-row-simple-horizontal-arrow'
  template: string // alias of type, kept for parity with other engines
  data: InfographicData
  theme: 'light' | 'dark' | 'hand-drawn'
  background: string
  width: number
  height: number
}

// ---- Templates ----
export interface TemplateDef<T = unknown> {
  id: string
  name: string
  description: string
  category: string
  config: T
}

// ---- AI Suggestion ----
export interface AISuggestion {
  recommendedType: string
  recommendedTypeName: string
  reason: string
  config: unknown
}
