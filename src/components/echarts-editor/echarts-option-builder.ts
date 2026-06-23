// Convert a friendly EChartsConfig into a real echarts option object.
// Tree-shakeable echarts is configured in echarts-editor.tsx — here we only
// build the plain JS option that `chart.setOption(...)` accepts.

import type { EChartsConfig } from '@/types/chart'
import type { EChartsCoreOption } from 'echarts/core'

interface ToolboxFeature extends Record<string, unknown> {
  saveAsImage?: Record<string, unknown>
}

const PALETTE = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#5a8dee',
]

function buildToolbox(): { feature: ToolboxFeature } {
  return {
    feature: {
      saveAsImage: { title: '保存为图片', pixelRatio: 2 },
      dataView: { title: '数据视图', readOnly: true, lang: ['数据视图', '关闭', '刷新'] },
      restore: { title: '还原' },
    },
  }
}

export function buildEChartsOption(config: EChartsConfig): EChartsCoreOption {
  const {
    title,
    legend,
    theme,
    type,
    categories,
    series_names,
    series_data,
    stack,
    smooth,
    horizontal,
    showLabel,
    showToolbox,
  } = config

  const base: EChartsCoreOption = {
    title: {
      text: title?.text ?? '',
      subtext: title?.subtext ?? '',
      left: 'center',
    },
    color: PALETTE,
    tooltip: { trigger: 'item' },
    textStyle: {
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  }

  if (showToolbox) {
    ;(base as Record<string, unknown>).toolbox = {
      ...buildToolbox(),
      left: 'right',
      top: 'top',
    }
  }

  if (legend && type !== 'gauge' && type !== 'funnel') {
    ;(base as Record<string, unknown>).legend = {
      bottom: 0,
      type: 'scroll',
    }
  } else if (legend && (type === 'funnel')) {
    ;(base as Record<string, unknown>).legend = {
      bottom: 0,
      type: 'scroll',
    }
  }

  switch (type) {
    case 'bar': {
      const series = series_names.map((name, i) => ({
        name,
        type: 'bar' as const,
        stack: stack ? 'total' : undefined,
        label: { show: showLabel, position: horizontal ? 'right' : 'top' },
        emphasis: { focus: 'series' as const },
        data: series_data[i] ?? [],
      }))
      return {
        ...base,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        grid: { left: '3%', right: '4%', bottom: legend ? '12%' : '6%', top: '15%', containLabel: true },
        xAxis: horizontal
          ? { type: 'value' }
          : { type: 'category', data: categories, axisTick: { alignWithLabel: true } },
        yAxis: horizontal
          ? { type: 'category', data: categories }
          : { type: 'value' },
        series,
      }
    }

    case 'line': {
      const isArea = series_names.length === 1 && categories.length > 0
      const series = series_names.map((name, i) => ({
        name,
        type: 'line' as const,
        smooth,
        stack: stack ? 'total' : undefined,
        areaStyle: isArea || stack ? { opacity: 0.25 } : undefined,
        label: { show: showLabel, position: 'top' },
        emphasis: { focus: 'series' as const },
        data: series_data[i] ?? [],
      }))
      return {
        ...base,
        tooltip: { trigger: 'axis' },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        grid: { left: '3%', right: '4%', bottom: legend ? '12%' : '6%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: categories },
        yAxis: { type: 'value' },
        series,
      }
    }

    case 'pie': {
      const data = config.single_series_data ?? []
      const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0)
      const donut = total > 0 && data.length >= 3 // visually feel like donut for richer pie
      return {
        ...base,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        series: [
          {
            name: series_names[0] ?? '系列',
            type: 'pie',
            radius: donut ? ['40%', '70%'] : '65%',
            center: ['50%', '52%'],
            avoidLabelOverlap: true,
            label: { show: showLabel, formatter: '{b}: {d}%' },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold' },
              itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.4)' },
            },
            labelLine: { show: showLabel },
            data,
          },
        ],
      }
    }

    case 'scatter': {
      const data = config.scatter_data ?? []
      return {
        ...base,
        tooltip: {
          trigger: 'item',
          formatter: (p: { value: [number, number] }) => `x: ${p.value[0]}<br/>y: ${p.value[1]}`,
        },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        grid: { left: '3%', right: '4%', bottom: legend ? '12%' : '6%', top: '15%', containLabel: true },
        xAxis: { type: 'value', name: 'X', scale: true },
        yAxis: { type: 'value', name: 'Y', scale: true },
        series: [
          {
            name: series_names[0] ?? '系列',
            type: 'scatter',
            symbolSize: 12,
            label: { show: showLabel, position: 'top' },
            emphasis: { focus: 'series' as const, label: { show: true } },
            data,
          },
        ],
      }
    }

    case 'radar': {
      const indicators = config.radar_indicators ?? []
      return {
        ...base,
        tooltip: { trigger: 'item' },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        radar: {
          indicator: indicators,
          shape: 'polygon',
          splitNumber: 5,
          axisName: { color: '#666' },
        },
        series: [
          {
            type: 'radar',
            data: series_names.map((name, i) => ({
              name,
              value: series_data[i] ?? [],
              label: { show: showLabel },
              areaStyle: { opacity: 0.2 },
            })),
            emphasis: { focus: 'series' as const },
          },
        ],
      }
    }

    case 'funnel': {
      const data = config.single_series_data ?? []
      return {
        ...base,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: legend ? { bottom: 0, type: 'scroll' } : undefined,
        series: [
          {
            name: series_names[0] ?? '系列',
            type: 'funnel',
            left: '10%',
            top: '15%',
            bottom: legend ? '12%' : '6%',
            width: '80%',
            min: 0,
            max: Math.max(...data.map((d) => Number(d.value) || 0), 1),
            sort: 'descending',
            gap: 2,
            label: { show: showLabel, position: 'inside' },
            labelLine: { show: false },
            emphasis: { label: { fontSize: 16 } },
            data,
          },
        ],
      }
    }

    case 'gauge': {
      const value = Number(config.gauge_value) || 0
      const max = Number(config.gauge_max) || 100
      return {
        ...base,
        tooltip: { trigger: 'item', formatter: `{b}: ${value}` },
        series: [
          {
            name: series_names[0] ?? '系列',
            type: 'gauge',
            min: 0,
            max,
            progress: { show: true, width: 18 },
            axisLine: { lineStyle: { width: 18 } },
            axisTick: { show: false },
            splitLine: { length: 12, lineStyle: { width: 2, color: '#999' } },
            pointer: { itemStyle: { color: 'auto' } },
            axisLabel: { distance: 25, color: '#999', fontSize: 12 },
            anchor: { show: true, size: 16, itemStyle: { color: 'auto', borderColor: '#fff', borderWidth: 1 } },
            detail: {
              valueAnimation: true,
              fontSize: 28,
              offsetCenter: [0, '70%'],
              formatter: `{value}${max === 100 ? '%' : ''}`,
            },
            title: { offsetCenter: [0, '95%'], fontSize: 14, color: '#666' },
            data: [{ value, name: series_names[0] ?? '指标' }],
          },
        ],
      }
    }

    case 'heatmap': {
      // Use categories as X axis, series_names as Y axis, series_data as the matrix.
      const xData = categories
      const yData = series_names
      const data: [number, number, number][] = []
      let maxVal = 0
      for (let y = 0; y < yData.length; y++) {
        const row = series_data[y] ?? []
        for (let x = 0; x < xData.length; x++) {
          const v = Number(row[x]) || 0
          if (v > maxVal) maxVal = v
          data.push([x, y, v])
        }
      }
      return {
        ...base,
        tooltip: {
          trigger: 'item',
          formatter: (p: { value: [number, number, number] }) =>
            `${yData[p.value[1]]} · ${xData[p.value[0]]}<br/>值：${p.value[2]}`,
        },
        legend: undefined,
        grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: xData, splitArea: { show: true } },
        yAxis: { type: 'category', data: yData, splitArea: { show: true } },
        visualMap: {
          min: 0,
          max: maxVal || 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          inRange: { color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'] },
        },
        series: [
          {
            name: '热力',
            type: 'heatmap',
            data,
            label: { show: showLabel },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } },
          },
        ],
      }
    }

    default: {
      return base
    }
  }
}
