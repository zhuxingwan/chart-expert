// Shared type definitions for the chart-making tool

export type ChartEngine = 'echarts' | 'mermaid' | 'antv-g6'

export interface SavedChart {
  id: string
  title: string
  engine: ChartEngine
  type: string
  config: unknown
  thumbnail: string | null
  createdAt: string
  updatedAt: string
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

// ---- AntV G6 ----
export interface AntVNode {
  id: string
  label: string
  group?: string
}
export interface AntVEdge {
  source: string
  target: string
  label?: string
}
export interface AntVConfig {
  type: string
  layout: string
  nodes: AntVNode[]
  edges: AntVEdge[]
  theme: string
  nodeColor: string
  edgeColor: string
  direction: 'LR' | 'TB' | 'RL' | 'BT' | 'H' | 'V'
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
