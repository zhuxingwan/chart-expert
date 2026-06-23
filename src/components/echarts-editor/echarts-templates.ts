// ECharts chart templates — a curated, non-coder-friendly gallery.
// Each `defaultConfig` is a complete EChartsConfig so the editor can apply it
// directly via `onChange(deepClone(defaultConfig))`.

import type { EChartsConfig } from '@/types/chart'

export interface EChartsTemplate {
  id: string
  name: string
  description: string
  category: string
  /** Underlying echarts `type` (bar | line | pie | scatter | radar | funnel | gauge | heatmap) */
  type: string
  defaultConfig: EChartsConfig
}

export const ECHARTS_TEMPLATE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'radar', label: 'Radar' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'gauge', label: 'Gauge' },
  { id: 'heatmap', label: 'Heatmap' },
]

export const ECHARTS_TEMPLATES: EChartsTemplate[] = [
  // ---------- Bar ----------
  {
    id: 'bar',
    name: 'Bar Chart',
    description: 'Classic vertical bar chart, ideal for comparing values across categories.',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: 'Quarterly Sales Comparison', subtext: '2024 product lines (10K USD)' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      series_names: ['Product A', 'Product B', 'Product C'],
      series_data: [
        [120, 200, 150, 80],
        [90, 160, 130, 110],
        [60, 90, 75, 130],
      ],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },
  {
    id: 'bar-horizontal',
    name: 'Horizontal Bar Chart',
    description: 'Horizontal bars — clearer when category names are long or for rankings.',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: 'City User Activity', subtext: 'Daily active users (10K)' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou', 'Chengdu'],
      series_names: ['DAU', 'MAU'],
      series_data: [
        [320, 410, 280, 360, 210, 180],
        [1200, 1500, 1100, 1300, 800, 700],
      ],
      stack: false,
      smooth: false,
      horizontal: true,
      showLabel: true,
      showToolbox: true,
    },
  },
  {
    id: 'bar-stack',
    name: 'Stacked Bar Chart',
    description: 'Multiple stacked series showing both totals and composition.',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: 'Department Budget Composition', subtext: 'HR / Ops / R&D stacked (10K USD)' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series_names: ['HR', 'Ops', 'R&D'],
      series_data: [
        [40, 42, 45, 50, 48, 52],
        [25, 28, 30, 32, 35, 38],
        [55, 60, 65, 70, 72, 78],
      ],
      stack: true,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },

  // ---------- Line ----------
  {
    id: 'line',
    name: 'Line Chart',
    description: 'Shows trends over time.',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: 'Website Traffic Trend', subtext: 'Last 7 days PV / UV' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series_names: ['PV', 'UV'],
      series_data: [
        [820, 932, 901, 934, 1290, 1330, 1520],
        [320, 380, 410, 430, 510, 530, 620],
      ],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },
  {
    id: 'line-smooth',
    name: 'Smooth Line Chart',
    description: 'Curved line chart for softer trends.',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: 'Temperature Changes', subtext: 'Weekly high / low (°C)' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series_names: ['High', 'Low'],
      series_data: [
        [22, 25, 28, 26, 24, 21, 19],
        [12, 14, 16, 15, 13, 11, 10],
      ],
      stack: false,
      smooth: true,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },
  {
    id: 'area',
    name: 'Area Chart',
    description: 'Line chart with shaded fill, emphasizing cumulative volume.',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: 'Cumulative Sales', subtext: 'H1 monthly cumulative (10K USD)' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series_names: ['Cumulative Sales'],
      series_data: [[100, 230, 380, 520, 690, 880]],
      stack: false,
      smooth: true,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },

  // ---------- Pie ----------
  {
    id: 'pie',
    name: 'Pie Chart',
    description: 'Shows the share of each category in the total.',
    category: 'pie',
    type: 'pie',
    defaultConfig: {
      title: { text: 'Traffic Sources', subtext: 'Share of visits by channel' },
      legend: true,
      theme: 'default',
      type: 'pie',
      categories: [],
      series_names: ['Traffic'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      single_series_data: [
        { name: 'Search Engine', value: 1048 },
        { name: 'Direct', value: 735 },
        { name: 'Email', value: 580 },
        { name: 'Affiliate Ads', value: 484 },
        { name: 'Video Ads', value: 300 },
      ],
    },
  },
  {
    id: 'pie-donut',
    name: 'Donut Chart',
    description: 'Hollow pie chart — center can display a key metric.',
    category: 'pie',
    type: 'pie',
    defaultConfig: {
      title: { text: 'Device Distribution', subtext: 'Share by terminal device' },
      legend: true,
      theme: 'default',
      type: 'pie',
      categories: [],
      series_names: ['Device'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      single_series_data: [
        { name: 'iOS', value: 1280 },
        { name: 'Android', value: 1890 },
        { name: 'Web', value: 760 },
        { name: 'Mini Program', value: 420 },
      ],
    },
  },

  // ---------- Scatter ----------
  {
    id: 'scatter',
    name: 'Scatter Plot',
    description: 'Shows the distribution of two variables.',
    category: 'scatter',
    type: 'scatter',
    defaultConfig: {
      title: { text: 'Height vs Weight', subtext: 'Sample height (cm) vs weight (kg)' },
      legend: true,
      theme: 'default',
      type: 'scatter',
      categories: [],
      series_names: ['Samples'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: false,
      showToolbox: true,
      scatter_data: [
        [161, 51], [167, 59], [159, 47], [157, 53], [155, 45],
        [170, 63], [163, 56], [180, 80], [175, 72], [172, 67],
        [168, 62], [178, 75], [165, 58], [185, 88], [182, 84],
      ],
    },
  },

  // ---------- Radar ----------
  {
    id: 'radar',
    name: 'Radar Chart',
    description: 'Multi-dimensional comparison, commonly used for capability assessment.',
    category: 'radar',
    type: 'radar',
    defaultConfig: {
      title: { text: 'Capability Radar', subtext: 'Our product vs competitor' },
      legend: true,
      theme: 'default',
      type: 'radar',
      categories: [],
      series_names: ['Our Product', 'Competitor A'],
      series_data: [
        [85, 70, 90, 65, 80, 75],
        [72, 88, 65, 80, 70, 82],
      ],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      radar_indicators: [
        { name: 'Features', max: 100 },
        { name: 'Usability', max: 100 },
        { name: 'Performance', max: 100 },
        { name: 'Design', max: 100 },
        { name: 'Service', max: 100 },
        { name: 'Price', max: 100 },
      ],
    },
  },

  // ---------- Funnel ----------
  {
    id: 'funnel',
    name: 'Funnel Chart',
    description: 'Shows conversion funnels, commonly used in operations analysis.',
    category: 'funnel',
    type: 'funnel',
    defaultConfig: {
      title: { text: 'Purchase Conversion Funnel', subtext: 'From visit to repurchase' },
      legend: true,
      theme: 'default',
      type: 'funnel',
      categories: [],
      series_names: ['Conversion'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      single_series_data: [
        { name: 'Visit', value: 10000 },
        { name: 'Sign Up', value: 4500 },
        { name: 'Add to Cart', value: 2200 },
        { name: 'Place Order', value: 1300 },
        { name: 'Repurchase', value: 480 },
      ],
    },
  },

  // ---------- Gauge ----------
  {
    id: 'gauge',
    name: 'Gauge',
    description: 'Shows a single-value metric — completion rate or score.',
    category: 'gauge',
    type: 'gauge',
    defaultConfig: {
      title: { text: 'Annual Goal Completion', subtext: 'Current completion (%)' },
      legend: false,
      theme: 'default',
      type: 'gauge',
      categories: [],
      series_names: ['Completion'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      gauge_value: 68,
      gauge_max: 100,
    },
  },

  // ---------- Heatmap ----------
  {
    id: 'heatmap',
    name: 'Heatmap',
    description: 'Uses color intensity to show strength in 2D data.',
    category: 'heatmap',
    type: 'heatmap',
    defaultConfig: {
      title: { text: 'Weekly Activity Heatmap', subtext: 'Visit intensity by time slot' },
      legend: true,
      theme: 'default',
      type: 'heatmap',
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series_names: ['0-6h', '6-12h', '12-18h', '18-24h'],
      // Heatmap reuses series_data: each inner array gives per-column values in `categories` order
      series_data: [
        [3, 4, 2, 5, 6, 8, 9],
        [12, 15, 14, 16, 18, 22, 25],
        [25, 28, 30, 32, 35, 28, 22],
        [40, 42, 38, 45, 48, 30, 26],
      ],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },
]

/** Quick lookup by template id. */
export const TEMPLATE_BY_ID: Record<string, EChartsTemplate> = ECHARTS_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = t
    return acc
  },
  {} as Record<string, EChartsTemplate>,
)

/** Default template used when the editor is mounted with no config. */
export const DEFAULT_TEMPLATE = ECHARTS_TEMPLATES[0]

export const THEME_OPTIONS: { value: string; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'macarons', label: 'Macarons' },
]
