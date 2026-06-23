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
  { id: 'bar', label: '柱状图' },
  { id: 'line', label: '折线图' },
  { id: 'pie', label: '饼图' },
  { id: 'scatter', label: '散点图' },
  { id: 'radar', label: '雷达图' },
  { id: 'funnel', label: '漏斗图' },
  { id: 'gauge', label: '仪表盘' },
  { id: 'heatmap', label: '热力图' },
]

export const ECHARTS_TEMPLATES: EChartsTemplate[] = [
  // ---------- 柱状图 ----------
  {
    id: 'bar',
    name: '柱状图',
    description: '经典的垂直柱状图，适合对比不同类别的数值。',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: '季度销售额对比', subtext: '2024 年各产品线业绩（单位：万元）' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      series_names: ['产品 A', '产品 B', '产品 C'],
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
    name: '横向柱状图',
    description: '条形图，类别名较长或对比排名时更清晰。',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: '城市用户活跃度', subtext: '日活跃用户数（万）' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
      series_names: ['日活', '月活'],
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
    name: '堆叠柱状图',
    description: '多系列堆叠展示总量与构成。',
    category: 'bar',
    type: 'bar',
    defaultConfig: {
      title: { text: '各部门预算构成', subtext: '人力 / 运营 / 研发 堆叠（万元）' },
      legend: true,
      theme: 'default',
      type: 'bar',
      categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series_names: ['人力', '运营', '研发'],
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

  // ---------- 折线图 ----------
  {
    id: 'line',
    name: '折线图',
    description: '展示随时间变化的趋势走势。',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: '网站访问量趋势', subtext: '近 7 天 PV / UV' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
    name: '平滑折线图',
    description: '曲线版折线图，趋势更柔和。',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: '气温变化', subtext: '一周最高 / 最低气温（°C）' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      series_names: ['最高温', '最低温'],
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
    name: '面积图',
    description: '折线图带阴影填充，强调累计体量。',
    category: 'line',
    type: 'line',
    defaultConfig: {
      title: { text: '销售额累计', subtext: '上半年月度累计（万元）' },
      legend: true,
      theme: 'default',
      type: 'line',
      categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series_names: ['累计销售额'],
      series_data: [[100, 230, 380, 520, 690, 880]],
      stack: false,
      smooth: true,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
    },
  },

  // ---------- 饼图 ----------
  {
    id: 'pie',
    name: '饼图',
    description: '展示各类别占比构成。',
    category: 'pie',
    type: 'pie',
    defaultConfig: {
      title: { text: '流量来源占比', subtext: '各渠道访问占比' },
      legend: true,
      theme: 'default',
      type: 'pie',
      categories: [],
      series_names: ['流量'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      single_series_data: [
        { name: '搜索引擎', value: 1048 },
        { name: '直接访问', value: 735 },
        { name: '邮件营销', value: 580 },
        { name: '联盟广告', value: 484 },
        { name: '视频广告', value: 300 },
      ],
    },
  },
  {
    id: 'pie-donut',
    name: '环形图',
    description: '中空的饼图，中心可放总数等关键指标。',
    category: 'pie',
    type: 'pie',
    defaultConfig: {
      title: { text: '设备分布', subtext: '终端设备占比' },
      legend: true,
      theme: 'default',
      type: 'pie',
      categories: [],
      series_names: ['设备'],
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
        { name: '小程序', value: 420 },
      ],
    },
  },

  // ---------- 散点图 ----------
  {
    id: 'scatter',
    name: '散点图',
    description: '展示两个变量之间的关系分布。',
    category: 'scatter',
    type: 'scatter',
    defaultConfig: {
      title: { text: '身高 vs 体重', subtext: '样本身高（cm）与体重（kg）' },
      legend: true,
      theme: 'default',
      type: 'scatter',
      categories: [],
      series_names: ['样本'],
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

  // ---------- 雷达图 ----------
  {
    id: 'radar',
    name: '雷达图',
    description: '多维能力对比，常用于能力评估。',
    category: 'radar',
    type: 'radar',
    defaultConfig: {
      title: { text: '能力雷达图', subtext: '产品 vs 竞品多维对比' },
      legend: true,
      theme: 'default',
      type: 'radar',
      categories: [],
      series_names: ['本产品', '竞品 A'],
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
        { name: '功能', max: 100 },
        { name: '易用性', max: 100 },
        { name: '性能', max: 100 },
        { name: '设计', max: 100 },
        { name: '服务', max: 100 },
        { name: '价格', max: 100 },
      ],
    },
  },

  // ---------- 漏斗图 ----------
  {
    id: 'funnel',
    name: '漏斗图',
    description: '展示转化漏斗，常用于运营分析。',
    category: 'funnel',
    type: 'funnel',
    defaultConfig: {
      title: { text: '购买转化漏斗', subtext: '从访问到复购的转化路径' },
      legend: true,
      theme: 'default',
      type: 'funnel',
      categories: [],
      series_names: ['转化'],
      series_data: [],
      stack: false,
      smooth: false,
      horizontal: false,
      showLabel: true,
      showToolbox: true,
      single_series_data: [
        { name: '访问', value: 10000 },
        { name: '注册', value: 4500 },
        { name: '加购', value: 2200 },
        { name: '下单', value: 1300 },
        { name: '复购', value: 480 },
      ],
    },
  },

  // ---------- 仪表盘 ----------
  {
    id: 'gauge',
    name: '仪表盘',
    description: '展示单值指标完成度或评分。',
    category: 'gauge',
    type: 'gauge',
    defaultConfig: {
      title: { text: '年度目标完成率', subtext: '当前完成度（%）' },
      legend: false,
      theme: 'default',
      type: 'gauge',
      categories: [],
      series_names: ['完成率'],
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

  // ---------- 热力图 ----------
  {
    id: 'heatmap',
    name: '热力图',
    description: '用颜色深浅展示二维数据的强弱。',
    category: 'heatmap',
    type: 'heatmap',
    defaultConfig: {
      title: { text: '一周活跃热力图', subtext: '不同时段的访问强度' },
      legend: true,
      theme: 'default',
      type: 'heatmap',
      categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      series_names: ['0-6时', '6-12时', '12-18时', '18-24时'],
      // 热力图借用 series_data：每个内层数组按 categories 顺序给出每列的值
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
  { value: 'default', label: '默认' },
  { value: 'dark', label: '深色' },
  { value: 'vintage', label: '复古' },
  { value: 'macarons', label: '马卡龙' },
]
