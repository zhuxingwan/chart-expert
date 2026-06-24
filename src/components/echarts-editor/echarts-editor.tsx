'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useVizLibs, getECharts } from '@/lib/viz-libs/cdn-loader'
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Triangle,
  Gauge,
  Grid3x3,
  Share2,
  Workflow,
  Sun,
  Waves,
  AlignVerticalDistributeCenter,
  ChartCandlestick,
  Plus,
  Trash2,
  Shuffle,
  Download,
  Copy,
  AlignLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { EChartsConfig, SunburstNode } from '@/types/chart'
import { useT, useI18n } from '@/lib/i18n'
import { useProFeature } from '@/lib/license/use-pro-feature'
import { drawWatermark } from '@/lib/license/watermark'
import {
  getEChartsTemplateName,
  getEChartsCategoryLabel,
  getEChartsTemplateDescription,
} from '@/lib/i18n/template-names'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ECHARTS_TEMPLATES,
  ECHARTS_TEMPLATE_CATEGORIES,
  TEMPLATE_BY_ID,
  DEFAULT_TEMPLATE,
  THEME_OPTIONS,
  type EChartsTemplate,
} from './echarts-templates'
import { buildEChartsOption } from './echarts-option-builder'

// ECharts is loaded from CDN via <VizLibLoader>. getECharts() returns
// window.echarts — the FULL bundle, with every chart type and component
// already registered. No `echarts.use([...])` registration is needed here.
// Themes shipped in the CDN build (dark / vintage / macarons) are passed
// directly to echarts.init(dom, themeName); unknown names fall back silently.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deepClone<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v)
  return JSON.parse(JSON.stringify(v)) as T
}

function configKey(c: EChartsConfig | null): string {
  if (!c) return ''
  return JSON.stringify(c)
}

/**
 * Maps a chart `type` to its "data group" — templates in the same group share
 * the same data structure and can be switched between freely.
 */
const TYPE_TO_GROUP: Record<string, string> = {
  bar: 'cartesian', line: 'cartesian', heatmap: 'cartesian',
  pie: 'singleSeries', funnel: 'singleSeries', treemap: 'singleSeries', sunburst: 'singleSeries',
  radar: 'radar',
  scatter: 'scatter',
  gauge: 'gauge',
  candlestick: 'candlestick',
  boxplot: 'boxplot',
  graph: 'graph',
  sankey: 'sankey',
  parallel: 'parallel',
  themeRiver: 'themeRiver',
}

/**
 * Fingerprint of ONLY the data-bearing fields of a config (categories,
 * series_data, single_series_data, scatter_data, radar_indicators, …).
 *
 * Used to tell whether the user has actually *edited the data* — independently
 * of any style toggles (horizontal / stack / smooth / pie_variant) they may
 * also have flipped. Comparing the full `configKey` would wrongly flag a
 * pure style toggle as "data modified" and pollute the per-group cache with
 * default sample data.
 */
function dataKey(c: EChartsConfig | null): string {
  if (!c) return ''
  const g = TYPE_TO_GROUP[c.type] ?? 'cartesian'
  const f: Record<string, unknown> = { g }
  switch (g) {
    case 'cartesian':
      f.cat = c.categories; f.sn = c.series_names; f.sd = c.series_data
      break
    case 'singleSeries':
      f.ssd = c.single_series_data
      break
    case 'radar':
      f.ri = c.radar_indicators; f.sn = c.series_names; f.sd = c.series_data
      break
    case 'scatter':
      f.scd = c.scatter_data
      break
    case 'gauge':
      f.gv = c.gauge_value; f.gm = c.gauge_max
      break
    case 'candlestick':
      f.cat = c.categories; f.cd = c.candlestick_data
      break
    case 'boxplot':
      f.cat = c.categories; f.bd = c.boxplot_data
      break
    case 'graph':
      f.gn = c.graph_nodes; f.gl = c.graph_links
      break
    case 'sankey':
      f.skn = c.sankey_nodes; f.skl = c.sankey_links
      break
    case 'sunburst':
      f.sb = c.sunburst_data
      break
    case 'parallel':
      f.pdim = c.parallel_dims; f.pd = c.parallel_data
      break
    case 'themeRiver':
      f.tr = c.themeriver_data
      break
  }
  return JSON.stringify(f)
}

/** Map a template's type to a lucide icon. */
function iconForType(type: string) {
  switch (type) {
    case 'bar':
      return BarChart3
    case 'line':
      return LineChartIcon
    case 'pie':
      return PieChartIcon
    case 'scatter':
      return Activity
    case 'radar':
      return Target
    case 'funnel':
      return Triangle
    case 'gauge':
      return Gauge
    case 'heatmap':
      return Grid3x3
    case 'candlestick':
      return ChartCandlestick
    case 'boxplot':
      return BarChart3
    case 'graph':
      return Share2
    case 'sankey':
      return Workflow
    case 'treemap':
      return Grid3x3
    case 'sunburst':
      return Sun
    case 'parallel':
      return AlignVerticalDistributeCenter
    case 'themeRiver':
      return Waves
    default:
      return BarChart3
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EChartsEditorProps {
  config: EChartsConfig | null
  onChange: (cfg: EChartsConfig) => void
  onTemplateChange?: (templateId: string) => void
  previewRef: React.RefObject<HTMLDivElement | null>
}

// ===========================================================================
// Component
// ===========================================================================

export function EChartsEditor({ config, onChange, onTemplateChange, previewRef }: EChartsEditorProps) {
  const t = useT()
  const { locale } = useI18n()
  const { isPro, requirePro } = useProFeature()
  // CDN-loaded echarts — status flips to 'loaded' once the <script> tag from
  // VizLibLoader finishes. We render a loading placeholder until then.
  const { status } = useVizLibs()
  const echartsLoaded = status.echarts === 'loaded'
  // Switch between mobile (vertical tabs) and desktop (horizontal panels) layout.
  const isMobile = useIsMobile()

  // Local "live" config — the editor's source of truth between parent updates.
  const [local, setLocal] = React.useState<EChartsConfig>(() =>
    config ? deepClone(config) : deepClone(DEFAULT_TEMPLATE.defaultConfig),
  )

  // Track which template is currently applied so the chart-type Select can show
  // the right value. Initialized by best-effort matching the initial `config`
  // prop (handles URL preselect like `?chart=echarts:pie`), then updated
  // whenever the user picks a template or the parent pushes a new config.
  const [currentTemplateId, setCurrentTemplateId] = React.useState<string>(() => {
    if (config) {
      const key = configKey(config)
      const exact = ECHARTS_TEMPLATES.find(
        (t) => configKey(t.defaultConfig) === key,
      )
      if (exact) return exact.id
      const byType = ECHARTS_TEMPLATES.find(
        (t) => t.type === (config as EChartsConfig).type,
      )
      if (byType) return byType.id
    }
    return DEFAULT_TEMPLATE.id
  })

  // Track the last config we accepted from props to avoid feedback loops.
  const lastAppliedKey = React.useRef<string>(configKey(config))

  // Accept new config from the parent (AI suggestion / loaded chart) — only
  // when the JSON actually differs from what we last applied.
  React.useEffect(() => {
    const incomingKey = configKey(config)
    if (incomingKey && incomingKey !== lastAppliedKey.current) {
      lastAppliedKey.current = incomingKey
      const next = deepClone(config as EChartsConfig)
      setLocal(next)
      // Best-effort template match by exact defaultConfig equality, then by type.
      const exact = ECHARTS_TEMPLATES.find(
        (t) => configKey(t.defaultConfig) === incomingKey,
      )
      if (exact) {
        setCurrentTemplateId(exact.id)
      } else {
        const byType = ECHARTS_TEMPLATES.find((t) => t.type === next.type)
        if (byType) setCurrentTemplateId(byType.id)
      }
    }
  }, [config])

  // Push local edits up to the parent.
  const commit = React.useCallback(
    (next: EChartsConfig) => {
      setLocal(next)
      const key = configKey(next)
      lastAppliedKey.current = key
      onChange(next)
    },
    [onChange],
  )

  // ----- ECharts instance -----
  const chartContainerRef = React.useRef<HTMLDivElement | null>(null)
  // `any` because echarts is externalized to a CDN global — the ECharts TS
  // types aren't resolvable at build time. The CDN full build exposes all
  // runtime methods we need (init / setOption / dispose / resize / getDataURL).
  const chartRef = React.useRef<any>(null)
  const currentTheme = React.useRef<string>('default')
  const resizeObsRef = React.useRef<ResizeObserver | null>(null)

  // ----- Fullscreen preview state (must be declared before effects that use it) -----
  const [fullscreen, setFullscreen] = React.useState(false)

  // Build the option with useMemo so re-renders are cheap.
  const option = React.useMemo(() => buildEChartsOption(local), [local])

  const renderChart = React.useCallback(() => {
    if (!chartContainerRef.current) return
    const echartsLib = getECharts()
    if (!echartsLib) return // CDN not ready yet — re-runs when status changes
    const theme = local.theme || 'default'

    // Re-create the instance if the theme changed. The CDN build auto-
    // registers every theme shipped in the bundle (dark / vintage / macarons).
    // Unknown theme names silently fall back to the default theme.
    if (!chartRef.current || currentTheme.current !== theme) {
      chartRef.current?.dispose()
      chartRef.current = echartsLib.init(
        chartContainerRef.current,
        theme === 'default' ? undefined : theme,
        { renderer: 'canvas' },
      )
      currentTheme.current = theme
    }
    chartRef.current.setOption(option, true)
  }, [option, local.theme])

  // Debounced re-render (150ms) when the option changes OR once the CDN
  // finishes loading. Skipped entirely until echarts is ready.
  React.useEffect(() => {
    if (!echartsLoaded) return
    const t = window.setTimeout(() => {
      renderChart()
    }, 150)
    return () => window.clearTimeout(t)
  }, [renderChart, echartsLoaded])

  // Init ResizeObserver + dispose on unmount. The actual first render is
  // triggered by the debounced effect above once the CDN is ready.
  // Re-runs on `isMobile` change so the observer (and chart instance) rebinds
  // to the new container that mounts when the layout switches.
  // Also re-runs on `fullscreen` toggle so the chart rebinds to the new
  // container inside the fullscreen overlay.
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const ro = new ResizeObserver(() => {
      chartRef.current?.resize()
    })
    ro.observe(chartContainerRef.current)
    resizeObsRef.current = ro

    return () => {
      ro.disconnect()
      resizeObsRef.current = null
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [isMobile, fullscreen])

  // Force a re-render after the layout switches so the freshly mounted
  // chart container gets the option applied.
  React.useEffect(() => {
    if (!echartsLoaded) return
    const id = window.setTimeout(() => renderChart(), 50)
    return () => window.clearTimeout(id)
  }, [isMobile, fullscreen, renderChart, echartsLoaded])

  // ----- Mutators (keep immutable) -----
  const patch = React.useCallback(
    (p: Partial<EChartsConfig>) => commit({ ...local, ...p }),
    [commit, local],
  )

  // ─── Data group cache ──────────────────────────────────────────────────
  // Templates are grouped by data structure (cartesian / singleSeries / radar /
  // scatter / …). When the user EDITS the data on a template, we cache that
  // user data under the group. On the next switch into the same group we
  // restore the cached user data so the user can preview the same data across
  // different presentations. Default (unmodified) sample data is NEVER cached —
  // so switching between two templates whose data the user hasn't touched will
  // swap in each template's own sample data (the expected "gallery" behavior).
  const groupCacheRef = React.useRef<Record<string, EChartsConfig>>({})

  // Convert data when switching between types (handles cross-group conversion)
  function convertDataForType(source: EChartsConfig, targetType: string): EChartsConfig {
    const next = deepClone(source)
    next.type = targetType
    const sourceType = source.type
    const sourceGroup = TYPE_TO_GROUP[sourceType] ?? 'cartesian'
    const targetGroup = TYPE_TO_GROUP[targetType] ?? 'cartesian'

    // Same group — no conversion needed
    if (sourceGroup === targetGroup) return next

    // cartesian → singleSeries: extract first series into single_series_data
    if (sourceGroup === 'cartesian' && targetGroup === 'singleSeries') {
      if (next.series_data?.length && (!next.single_series_data?.length)) {
        const names = next.categories.length > 0 ? next.categories : next.series_names
        const values = next.series_data[0] || []
        next.single_series_data = values.map((v, i) => ({ name: names[i] || `Item ${i + 1}`, value: v }))
      }
      return next
    }

    // singleSeries → cartesian: expand single_series_data into categories + series_data
    if (sourceGroup === 'singleSeries' && targetGroup === 'cartesian') {
      if (next.single_series_data?.length && (!next.series_data?.length)) {
        next.categories = next.single_series_data.map(d => d.name)
        next.series_names = ['Series 1']
        next.series_data = [next.single_series_data.map(d => d.value)]
      }
      return next
    }

    // cartesian → radar: create indicators from categories
    if (sourceGroup === 'cartesian' && targetGroup === 'radar') {
      if (!next.radar_indicators?.length) {
        const names = next.categories.length > 0 ? next.categories : next.series_names
        next.radar_indicators = names.map(n => ({ name: n, max: 100 }))
      }
      return next
    }

    // singleSeries → radar
    if (sourceGroup === 'singleSeries' && targetGroup === 'radar') {
      if (!next.radar_indicators?.length) {
        next.radar_indicators = (next.single_series_data || []).map(d => ({ name: d.name, max: 100 }))
        next.series_data = [(next.single_series_data || []).map(d => d.value)]
        next.series_names = ['Series 1']
      }
      return next
    }

    // radar → cartesian
    if (sourceGroup === 'radar' && targetGroup === 'cartesian') {
      if (next.radar_indicators?.length && (!next.categories?.length)) {
        next.categories = next.radar_indicators.map(i => i.name)
      }
      return next
    }

    // radar → singleSeries
    if (sourceGroup === 'radar' && targetGroup === 'singleSeries') {
      if (!next.single_series_data?.length && next.radar_indicators?.length) {
        const values = next.series_data?.[0] || []
        next.single_series_data = next.radar_indicators.map((ind, i) => ({ name: ind.name, value: values[i] || 0 }))
      }
      return next
    }

    return next
  }

  const applyTemplate = React.useCallback(
    (tpl: EChartsTemplate, keepTitle = false) => {
      const currentGroup = TYPE_TO_GROUP[local.type] ?? 'cartesian'
      const targetGroup = TYPE_TO_GROUP[tpl.type] ?? 'cartesian'
      const currentTpl = TEMPLATE_BY_ID[currentTemplateId] ?? DEFAULT_TEMPLATE

      // ── Has the user actually edited the DATA (not just toggled style)? ──
      // `dataKey` fingerprints only the data-bearing fields, so a pure style
      // toggle (horizontal / stack / smooth / pie_variant) does NOT count as a
      // data edit. This is the cornerstone of the switching rules below.
      const isUserDataModified = dataKey(local) !== dataKey(currentTpl.defaultConfig)

      // Cache the user's modified data under the CURRENT group so it can be
      // restored later when they switch back. Default sample data is never
      // cached — that keeps the cache a pure "user data" store.
      if (isUserDataModified) {
        groupCacheRef.current[currentGroup] = deepClone(local)
      }

      // ── Decide what DATA the new template should render ──
      //  • data still default sample  → use the new template's own sample data
      //    (so flipping through the gallery actually changes what's on screen)
      //  • user data + same group      → keep the user's data, only restyle
      //  • user data + cross-group     → prefer a previously-cached entry for
      //    the target group; otherwise convert the current data across groups
      let next: EChartsConfig
      let keepUserShowLabel = false // when true, carry over local.showLabel

      if (!isUserDataModified) {
        // (A) Default sample data → swap to the new template's full default.
        // This is what makes pie → donut → rose → half → nested each show a
        // different sample, and scatter → bubble → matrix likewise.
        next = deepClone(tpl.defaultConfig)
      } else if (targetGroup === currentGroup) {
        // (B) User data, same group → keep data, restyle in Step 3.
        next = deepClone(local)
        keepUserShowLabel = true
      } else {
        // (C) User data, cross-group.
        const cached = groupCacheRef.current[targetGroup]
        if (cached) {
          next = deepClone(cached)
          keepUserShowLabel = true
        } else {
          // No cached user data for the target group yet — convert the
          // current user data across groups so they don't lose their input.
          const converted = convertDataForType(local, tpl.type)
          const hasConvertedData =
            (targetGroup === 'cartesian' && converted.series_data?.length) ||
            (targetGroup === 'singleSeries' && converted.single_series_data?.length) ||
            (targetGroup === 'radar' && converted.radar_indicators?.length) ||
            (targetGroup === 'scatter' && converted.scatter_data?.length) ||
            (targetGroup === 'gauge' && converted.gauge_value !== undefined)
          if (hasConvertedData) {
            next = converted
            keepUserShowLabel = true
          } else {
            // Conversion produced nothing usable → fall back to the template's
            // own sample data for this group.
            next = deepClone(tpl.defaultConfig)
          }
        }
      }

      // ── Carry over global UI preferences (theme / legend / toolbox) ──
      // These are presentation preferences that should follow the user across
      // every template, regardless of which data branch above ran.
      next.theme = local.theme
      next.legend = local.legend
      next.showToolbox = local.showToolbox
      // showLabel: when reusing the user's own data, keep their label choice;
      // when using a template's fresh sample data, honor that template's
      // default (e.g. scatter defaults to labels off, pie to labels on).
      if (keepUserShowLabel) next.showLabel = local.showLabel

      // ── ALWAYS apply the new template's STRUCTURAL style fields ──
      // These define the chart's *form* and must follow the selected template
      // on every switch — even when reusing user data. Without this:
      //  • bar → bar-horizontal would be a no-op (both type:'bar', differ only
      //    in `horizontal`)
      //  • bar → bar-stack wouldn't stack (differ only in `stack`)
      //  • line → line-smooth wouldn't smooth (differ only in `smooth`)
      //  • pie → donut/rose/half/nested would all render identically (differ
      //    only in `pie_variant`)
      const tdef = tpl.defaultConfig
      next.type = tdef.type
      if (typeof tdef.horizontal === 'boolean') next.horizontal = tdef.horizontal
      if (typeof tdef.stack === 'boolean') next.stack = tdef.stack
      if (typeof tdef.smooth === 'boolean') next.smooth = tdef.smooth
      if (tdef.pie_variant) next.pie_variant = tdef.pie_variant
      else if (next.type === 'pie') delete next.pie_variant

      // Handle title
      if (keepTitle && local.title) {
        next.title = deepClone(local.title)
      }

      commit(next)
      setCurrentTemplateId(tpl.id)
      onTemplateChange?.('echarts:' + tpl.id)
      toast.success(
        t('toasts.applied', { name: getEChartsTemplateName(locale, tpl.id, tpl.name) }),
      )
    },
    [commit, local, currentTemplateId, t, onTemplateChange, locale],
  )

  const onTemplateIdChange = React.useCallback(
    (id: string) => {
      const tpl = TEMPLATE_BY_ID[id]
      if (tpl) applyTemplate(tpl, true)
    },
    [applyTemplate],
  )

  // ----- Zoom -----
  const [zoom, setZoom] = React.useState(1)
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2))
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2))
  const handleReset = () => setZoom(1)

  // Listen for Escape key to exit fullscreen
  React.useEffect(() => {
    if (!fullscreen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [fullscreen])

  // ----- Export handlers -----
  const handleDownloadPNG = React.useCallback(() => {
    if (!chartRef.current) {
      toast.error(t('toasts.noContent'))
      return
    }
    try {
      const url = chartRef.current.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff',
      })
      if (isPro) {
        // Pro: download directly
        const a = document.createElement('a')
        a.href = url
        a.download = `${local.title?.text || 'chart'}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success(t('toasts.exported'))
      } else {
        // Free: add watermark
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.drawImage(img, 0, 0)
          await drawWatermark(ctx, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            if (!blob) return
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `${local.title?.text || 'chart'}.png`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
          }, 'image/png')
          toast.success(t('toasts.exported'))
        }
        img.src = url
      }
    } catch {
      toast.error(t('toasts.exportFailed', { error: 'PNG' }))
    }
  }, [local.title, t, isPro])

  // Render the option into a hidden, off-screen SVG-renderer ECharts instance
  // and serialize the resulting SVG. The live preview uses the canvas renderer
  // (which can't produce SVG), so we spin up a temporary SVG-renderer instance
  // with the same option / size / theme, grab its <svg>, and tear it down.
  const handleDownloadSvg = React.useCallback(() => {
    if (!requirePro()) return
    const echartsLib = getECharts()
    if (!echartsLib || !chartContainerRef.current) {
      toast.error(t('toasts.noContent'))
      return
    }
    const temp = document.createElement('div')
    temp.style.width = chartContainerRef.current.clientWidth + 'px'
    temp.style.height = chartContainerRef.current.clientHeight + 'px'
    temp.style.position = 'absolute'
    temp.style.left = '-9999px'
    document.body.appendChild(temp)
    let tempChart: any = null
    try {
      const themeName =
        local.theme && local.theme !== 'default' ? local.theme : undefined
      tempChart = echartsLib.init(temp, themeName, { renderer: 'svg' })
      tempChart.setOption(option, true)
      const svg = temp.querySelector('svg')
      if (!svg) {
        toast.error(t('toasts.noContent'))
        return
      }
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      const svgStr = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${local.title?.text || 'chart'}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(t('toasts.exported'))
    } catch (e) {
      toast.error(t('toasts.exportFailed', { error: (e as Error).message }))
    } finally {
      try {
        tempChart?.dispose()
      } catch {
        // ignore
      }
      if (temp.parentNode) document.body.removeChild(temp)
    }
  }, [option, local.theme, local.title, t, requirePro])

  const handleCopyAsMarkdown = React.useCallback(async () => {
    if (!requirePro()) return
    try {
      const markdown = '```echarts\n' + JSON.stringify(option, null, 2) + '\n```'
      await navigator.clipboard.writeText(markdown)
      toast.success(t('toasts.markdownCopied'))
    } catch {
      toast.error(t('toasts.copyFailed'))
    }
  }, [option, t, requirePro])

  // ----- Random data -----
  const handleRandomData = React.useCallback(() => {
    const type = local.type
    if (type === 'pie' || type === 'funnel') {
      const data = (local.single_series_data ?? []).map((d) => ({
        name: d.name,
        value: Math.floor(Math.random() * 900) + 100,
      }))
      patch({ single_series_data: data })
    } else if (type === 'gauge') {
      const max = Number(local.gauge_max) || 100
      patch({ gauge_value: Math.floor(Math.random() * max) })
    } else if (type === 'scatter') {
      const data = (local.scatter_data ?? []).map(() => [
        Math.floor(Math.random() * 200) + 100,
        Math.floor(Math.random() * 60) + 40,
      ]) as [number, number][]
      patch({ scatter_data: data })
    } else if (type === 'heatmap') {
      const data = local.series_data.map((row) =>
        row.map(() => Math.floor(Math.random() * 50)),
      )
      patch({ series_data: data })
    } else if (type === 'radar') {
      const data = local.series_data.map((row) =>
        row.map(() => Math.floor(Math.random() * 100)),
      )
      patch({ series_data: data })
    } else if (type === 'candlestick') {
      const data = (local.candlestick_data ?? []).map(() => {
        const base = Math.floor(Math.random() * 100) + 100
        const swing = Math.floor(Math.random() * 20) + 5
        const open = base
        const close = base + Math.floor(Math.random() * swing * 2) - swing
        const low = Math.min(open, close) - Math.floor(Math.random() * swing)
        const high = Math.max(open, close) + Math.floor(Math.random() * swing)
        return [open, close, low, high] as [number, number, number, number]
      })
      patch({ candlestick_data: data })
    } else if (type === 'boxplot') {
      const data = (local.boxplot_data ?? []).map(() => {
        const min = Math.floor(Math.random() * 40) + 10
        const q1 = min + Math.floor(Math.random() * 10) + 5
        const median = q1 + Math.floor(Math.random() * 15) + 5
        const q3 = median + Math.floor(Math.random() * 15) + 5
        const max = q3 + Math.floor(Math.random() * 15) + 5
        return [min, q1, median, q3, max] as [number, number, number, number, number]
      })
      patch({ boxplot_data: data })
    } else if (type === 'graph') {
      patch({
        graph_nodes: (local.graph_nodes ?? []).map((n) => ({
          ...n,
          category: Math.floor(Math.random() * 3),
        })),
      })
    } else if (type === 'sankey') {
      patch({
        sankey_links: (local.sankey_links ?? []).map((l) => ({
          ...l,
          value: Math.floor(Math.random() * 4000) + 500,
        })),
      })
    } else if (type === 'sunburst') {
      const rand = (nodes: SunburstNode[]): SunburstNode[] =>
        nodes.map((n) => ({
          ...n,
          value: n.children?.length ? undefined : Math.floor(Math.random() * 50) + 5,
          ...(n.children ? { children: rand(n.children) } : {}),
        }))
      patch({ sunburst_data: rand(local.sunburst_data ?? []) })
    } else if (type === 'parallel') {
      patch({
        parallel_data: (local.parallel_data ?? []).map((row) =>
          row.map(() => Math.floor(Math.random() * 100)),
        ),
      })
    } else if (type === 'themeRiver') {
      patch({
        themeriver_data: (local.themeriver_data ?? []).map(
          (row) => [row[0], Math.floor(Math.random() * 400) + 20, row[2]] as [string, number, string],
        ),
      })
    } else {
      // bar / line
      const data = local.series_data.map((row) =>
        row.map(() => Math.floor(Math.random() * 200) + 20),
      )
      patch({ series_data: data })
    }
    toast.success(t('toasts.randomData'))
  }, [local, patch, t])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  // Extract the three sections as JSX variables so they can be rendered in
  // EITHER the mobile tab layout OR the desktop resizable-panel layout —
  // without duplicating the inner logic. Only one layout is in the DOM at a
  // time (driven by `useIsMobile`), so `previewRef` / `chartContainerRef`
  // always point at the actually-visible element.
  const templateGalleryEl = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t('echarts.templateGallery')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('echarts.galleryHint')}
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-1 gap-2 p-3">
          {ECHARTS_TEMPLATE_CATEGORIES.map((cat) => {
            const items = ECHARTS_TEMPLATES.filter((t) => t.category === cat.id)
            if (items.length === 0) return null
            return (
              <div key={cat.id} className="space-y-2">
                <div className="px-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {getEChartsCategoryLabel(locale, cat.id, cat.label)}
                </div>
                {items.map((tpl) => {
                  const Icon = iconForType(tpl.type)
                  const active = currentTemplateId === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={cn(
                        'group flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm',
                        active && 'border-primary',
                      )}
                      title={getEChartsTemplateDescription(locale, tpl.id, tpl.description)}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {getEChartsTemplateName(locale, tpl.id, tpl.name)}
                        </span>
                        <span className="line-clamp-2 text-[11px] text-muted-foreground">
                          {getEChartsTemplateDescription(locale, tpl.id, tpl.description)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  const previewToolbar = (
    <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
          aria-label={t('echarts.zoomOut')}
          className="h-7 w-7 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
          aria-label={t('echarts.zoomIn')}
          className="h-7 w-7 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          aria-label={t('echarts.resetZoom')}
          className="h-7 w-7 p-0"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownloadSvg}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Download className="h-3 w-3" /> SVG
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownloadPNG}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Download className="h-3 w-3" /> PNG
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyAsMarkdown}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Copy className="h-3 w-3" /> Markdown
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setFullscreen((f) => !f)}
          className="h-7 gap-1 px-2 text-xs"
          aria-label={fullscreen ? t('echarts.exitFullscreen') : t('echarts.enterFullscreen')}
        >
          {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          {fullscreen ? t('echarts.exit') : t('echarts.fullscreen')}
        </Button>
      </div>
    </div>
  )

  const previewCanvas = (
    <div
      ref={previewRef}
      className="relative min-h-0 flex-1 overflow-auto"
      style={{ background: '#fff' }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
          width: '100%',
          height: '100%',
        }}
      >
        <div
          ref={chartContainerRef}
          style={{ width: '100%', height: '100%', minHeight: 400 }}
        />
      </div>
      {!echartsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {t('app.loadingLib')}
          </span>
        </div>
      )}
    </div>
  )

  const previewEl = (
    <div className="flex h-full flex-col">
      {!fullscreen && previewToolbar}
      {!fullscreen && previewCanvas}
    </div>
  )

  // Fullscreen overlay — when active, takes over the entire viewport.
  // The toolbar + canvas JSX are the SAME elements (refs to previewRef /
  // chartContainerRef point here), so the ECharts instance rebinds via the
  // ResizeObserver effect keyed on `fullscreen`.
  const fullscreenOverlay = fullscreen ? (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {previewToolbar}
      {previewCanvas}
    </div>
  ) : null

  const configEl = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t('echarts.configPanel')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('echarts.configPanelHint')}
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          <Accordion
            type="multiple"
            defaultValue={['type', 'title', 'data', 'style']}
            className="w-full"
          >
            {/* 1. Chart type */}
            <AccordionItem value="type">
              <AccordionTrigger>
                <span className="flex items-center gap-2 font-medium">
                  <BarChart3 className="size-4 text-primary" /> {t('echarts.chartType')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('echarts.switchTypeHint')}</Label>
                  <Select value={currentTemplateId} onValueChange={onTemplateIdChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('echarts.selectChartType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ECHARTS_TEMPLATE_CATEGORIES.map((cat) => {
                        const items = ECHARTS_TEMPLATES.filter((t) => t.category === cat.id)
                        if (items.length === 0) return null
                        return (
                          <SelectGroup key={cat.id}>
                            <SelectLabel>
                              {getEChartsCategoryLabel(locale, cat.id, cat.label)}
                            </SelectLabel>
                            {items.map((tpl) => (
                              <SelectItem key={tpl.id} value={tpl.id}>
                                {getEChartsTemplateName(locale, tpl.id, tpl.name)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Title */}
            <AccordionItem value="title">
              <AccordionTrigger>
                <span className="flex items-center gap-2 font-medium">
                  <AlignLeft className="size-4 text-primary" /> {t('echarts.title_section')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title-text">{t('echarts.mainTitle')}</Label>
                    <Input
                      id="title-text"
                      value={local.title?.text ?? ''}
                      onChange={(e) =>
                        patch({ title: { ...local.title, text: e.target.value } })
                      }
                      placeholder={t('echarts.titlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="title-sub">{t('echarts.subtitle')}</Label>
                    <Input
                      id="title-sub"
                      value={local.title?.subtext ?? ''}
                      onChange={(e) =>
                        patch({ title: { ...local.title, subtext: e.target.value } })
                      }
                      placeholder={t('echarts.subtitlePlaceholder')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('echarts.titleSectionHint')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Data */}
            <AccordionItem value="data">
              <AccordionTrigger>
                <span className="flex items-center gap-2 font-medium">
                  <Plus className="size-4 text-primary" /> {t('echarts.data')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <DataEditor
                  config={local}
                  patch={patch}
                  onRandom={handleRandomData}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 4. Style */}
            <AccordionItem value="style">
              <AccordionTrigger>
                <span className="flex items-center gap-2 font-medium">
                  <Activity className="size-4 text-primary" /> {t('echarts.style')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <StyleEditor config={local} patch={patch} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )

  if (isMobile) {
    // Mobile: vertical tab layout — Template | Preview | Config
    return (
      <>
        <Tabs defaultValue="preview" className="flex h-full w-full flex-col gap-0">
          <TabsList className="grid h-10 w-full shrink-0 grid-cols-3 rounded-none border-b">
            <TabsTrigger value="templates" className="text-xs">
              {t('echarts.templateGallery')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              {t('echarts.preview')}
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              {t('echarts.configPanel')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="min-h-0 flex-1 overflow-hidden">
            {templateGalleryEl}
          </TabsContent>
          <TabsContent value="preview" className="min-h-0 flex-1 overflow-hidden">
            {previewEl}
          </TabsContent>
          <TabsContent value="config" className="min-h-0 flex-1 overflow-hidden">
            {configEl}
          </TabsContent>
        </Tabs>
        {fullscreenOverlay}
      </>
    )
  }

  // Desktop: horizontal resizable panels
  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* ----------------------- LEFT: Template Gallery ----------------------- */}
        <ResizablePanel defaultSize={20} minSize={14} className="bg-background">
          {templateGalleryEl}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ----------------------- MIDDLE: Preview ----------------------- */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-muted/20">
          {previewEl}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ----------------------- RIGHT: Config Form ----------------------- */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-background">
          {configEl}
        </ResizablePanel>
      </ResizablePanelGroup>
      {fullscreenOverlay}
    </>
  )
}

export default EChartsEditor

// ===========================================================================
// Sub-editors
// ===========================================================================

interface SubEditorProps {
  config: EChartsConfig
  patch: (p: Partial<EChartsConfig>) => void
}

// -------- Data editor (varies by chart type) --------
function DataEditor({ config, patch, onRandom }: SubEditorProps & { onRandom: () => void }) {
  const t = useT()
  const type = config.type
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {type === 'pie' || type === 'funnel'
            ? t('echarts.dataEditorHintPie')
            : type === 'radar'
              ? t('echarts.dataEditorHintRadar')
              : type === 'gauge'
                ? t('echarts.dataEditorHintGauge')
                : type === 'scatter'
                  ? t('echarts.dataEditorHintScatter')
                  : type === 'heatmap'
                    ? t('echarts.dataEditorHintHeatmap')
                    : type === 'candlestick'
                      ? t('echarts.dataEditorHintCandlestick')
                      : type === 'boxplot'
                        ? t('echarts.dataEditorHintBoxplot')
                        : type === 'graph'
                          ? t('echarts.dataEditorHintGraph')
                          : type === 'sankey'
                            ? t('echarts.dataEditorHintSankey')
                            : type === 'sunburst'
                              ? t('echarts.dataEditorHintSunburst')
                              : type === 'parallel'
                                ? t('echarts.dataEditorHintParallel')
                                : type === 'themeRiver'
                                  ? t('echarts.dataEditorHintThemeRiver')
                                  : t('echarts.dataEditorHintCartesian')}
        </p>
        <Button size="sm" variant="secondary" onClick={onRandom} className="shrink-0">
          <Shuffle className="size-3.5" /> {t('echarts.randomData')}
        </Button>
      </div>

      {type === 'pie' || type === 'funnel' ? (
        <SingleSeriesEditor config={config} patch={patch} />
      ) : type === 'radar' ? (
        <RadarDataEditor config={config} patch={patch} />
      ) : type === 'gauge' ? (
        <GaugeDataEditor config={config} patch={patch} />
      ) : type === 'scatter' ? (
        <ScatterDataEditor config={config} patch={patch} />
      ) : type === 'heatmap' ? (
        <CartesianDataEditor config={config} patch={patch} hideCategories />
      ) : type === 'candlestick' ? (
        <CandlestickDataEditor config={config} patch={patch} />
      ) : type === 'boxplot' ? (
        <BoxplotDataEditor config={config} patch={patch} />
      ) : type === 'graph' ? (
        <GraphDataEditor config={config} patch={patch} />
      ) : type === 'sankey' ? (
        <SankeyDataEditor config={config} patch={patch} />
      ) : type === 'sunburst' ? (
        <SunburstDataEditor config={config} patch={patch} />
      ) : type === 'parallel' ? (
        <ParallelDataEditor config={config} patch={patch} />
      ) : type === 'themeRiver' ? (
        <ThemeRiverDataEditor config={config} patch={patch} />
      ) : (
        <CartesianDataEditor config={config} patch={patch} />
      )}
    </div>
  )
}

// Bar / line / heatmap (matrix) editor
function CartesianDataEditor({
  config,
  patch,
  hideCategories,
}: SubEditorProps & { hideCategories?: boolean }) {
  const t = useT()
  const { categories, series_names, series_data } = config

  const updateSeriesName = (i: number, name: string) => {
    const next = [...series_names]
    next[i] = name
    patch({ series_names: next })
  }

  const updateSeriesValues = (i: number, raw: string) => {
    const parts = raw.split(/[,，]/).map((s) => Number(s.trim()))
    const cleaned = parts.map((n) => (Number.isFinite(n) ? n : 0))
    const next = series_data.map((row, idx) => (idx === i ? cleaned : row))
    patch({ series_data: next })
  }

  const addSeries = () => {
    const len = categories.length || 1
    const newRow = Array.from({ length: len }, () => 0)
    patch({
      series_names: [...series_names, `Series ${series_names.length + 1}`],
      series_data: [...series_data, newRow],
    })
  }

  const removeSeries = (i: number) => {
    if (series_names.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Series'))
      return
    }
    patch({
      series_names: series_names.filter((_, idx) => idx !== i),
      series_data: series_data.filter((_, idx) => idx !== i),
    })
  }

  return (
    <div className="space-y-3">
      {!hideCategories && (
        <div className="space-y-1.5">
          <Label>{t('echarts.categories')}</Label>
          <Input
            value={categories.join(', ')}
            onChange={(e) => {
              const arr = e.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean)
              patch({ categories: arr })
            }}
            placeholder={t('echarts.categoriesPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">
            {t('echarts.categoriesResizeHint')}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.data')}</Label>
          <Button size="sm" variant="outline" onClick={addSeries}>
            <Plus className="size-3.5" /> {t('echarts.addSeries')}
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.seriesName')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.seriesValues')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {series_names.map((name, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">
                    <Input
                      value={name}
                      onChange={(e) => updateSeriesName(i, e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={(series_data[i] ?? []).join(', ')}
                      onChange={(e) => updateSeriesValues(i, e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSeries(i)}
                      aria-label={t('echarts.removeSeries')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!hideCategories && (
          <p className="text-xs text-muted-foreground">
            {t('echarts.categoriesTipHint')}
          </p>
        )}
      </div>
    </div>
  )
}

// Pie / funnel editor
function SingleSeriesEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const data = config.single_series_data ?? []
  const update = (i: number, key: 'name' | 'value', val: string) => {
    const next = data.map((d, idx) =>
      idx === i
        ? { ...d, [key]: key === 'value' ? Number(val) || 0 : val }
        : d,
    )
    patch({ single_series_data: next })
  }
  const add = () =>
    patch({
      single_series_data: [...data, { name: `Item ${data.length + 1}`, value: 100 }],
    })
  const remove = (i: number) => {
    if (data.length <= 2) {
      toast.error(t('echarts.keepAtLeast2Items'))
      return
    }
    patch({ single_series_data: data.filter((_, idx) => idx !== i) })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.data')}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> {t('echarts.addItem')}
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemName')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemValue')}</th>
              <th className="w-10 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5">
                  <Input
                    value={d.name}
                    onChange={(e) => update(i, 'name', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={d.value}
                    onChange={(e) => update(i, 'value', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Radar editor
function RadarDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const indicators = config.radar_indicators ?? []
  const { series_names, series_data } = config

  const updateIndicator = (i: number, key: 'name' | 'max', val: string) =>
    patch({
      radar_indicators: indicators.map((it, idx) =>
        idx === i
          ? { ...it, [key]: key === 'max' ? Number(val) || 0 : val }
          : it,
      ),
    })
  const addIndicator = () =>
    patch({
      radar_indicators: [...indicators, { name: `Dimension ${indicators.length + 1}`, max: 100 }],
      series_data: series_data.map((row) => [...row, 0]),
    })
  const removeIndicator = (i: number) => {
    if (indicators.length <= 3) {
      toast.error(t('echarts.radarNeeds3Dimensions'))
      return
    }
    patch({
      radar_indicators: indicators.filter((_, idx) => idx !== i),
      series_data: series_data.map((row) => row.filter((_, idx) => idx !== i)),
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.radarDimensionsLabel')}</Label>
          <Button size="sm" variant="outline" onClick={addIndicator}>
            <Plus className="size-3.5" /> {t('echarts.addDimension')}
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.dimension')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.max')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((it, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">
                    <Input
                      value={it.name}
                      onChange={(e) => updateIndicator(i, 'name', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      value={it.max}
                      onChange={(e) => updateIndicator(i, 'max', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeIndicator(i)}
                      aria-label={t('actions.delete')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t('echarts.seriesValuesOrderLabel')}</Label>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.seriesName')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.values')}</th>
              </tr>
            </thead>
            <tbody>
              {series_names.map((name, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">
                    <Input
                      value={name}
                      onChange={(e) => {
                        const next = [...series_names]
                        next[i] = e.target.value
                        patch({ series_names: next })
                      }}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={(series_data[i] ?? []).join(', ')}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .split(/[,，]/)
                          .map((s) => Number(s.trim()))
                          .map((n) => (Number.isFinite(n) ? n : 0))
                        const next = series_data.map((row, idx) =>
                          idx === i ? cleaned : row,
                        )
                        patch({ series_data: next })
                      }}
                      className="h-8"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Gauge editor
function GaugeDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const value = Number(config.gauge_value) || 0
  const max = Number(config.gauge_max) || 100
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.currentValue')}</Label>
          <span className="text-sm font-medium tabular-nums">{value}</span>
        </div>
        <Slider
          min={0}
          max={max}
          step={1}
          value={[value]}
          onValueChange={(v) => patch({ gauge_value: v[0] ?? 0 })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gauge-max">{t('echarts.gaugeMaxLabel')}</Label>
        <Input
          id="gauge-max"
          type="number"
          value={max}
          onChange={(e) => patch({ gauge_max: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">{t('echarts.gaugeMaxHint')}</p>
      </div>
    </div>
  )
}

// Scatter editor
function ScatterDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const data = config.scatter_data ?? []
  const update = (i: number, axis: 0 | 1, val: string) => {
    const n = Number(val)
    const next = data.map((p, idx) =>
      idx === i ? ([axis === 0 ? n : p[0], axis === 1 ? n : p[1]] as [number, number]) : p,
    )
    patch({ scatter_data: next })
  }
  const add = () =>
    patch({ scatter_data: [...data, [Math.floor(Math.random() * 200) + 100, Math.floor(Math.random() * 60) + 40]] })
  const remove = (i: number) => {
    if (data.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Point'))
      return
    }
    patch({ scatter_data: data.filter((_, idx) => idx !== i) })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.dataPoints')}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> {t('echarts.addPoint')}
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">X</th>
              <th className="px-2 py-1.5 text-left font-medium">Y</th>
              <th className="w-10 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={p[0]}
                    onChange={(e) => update(i, 0, e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={p[1]}
                    onChange={(e) => update(i, 1, e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Candlestick editor — [open, close, low, high][] with date/label categories
// ---------------------------------------------------------------------------
function CandlestickDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const cats = config.categories ?? []
  const data = config.candlestick_data ?? []

  const updateCat = (i: number, val: string) =>
    patch({ categories: cats.map((c, idx) => (idx === i ? val : c)) })
  const updateField = (i: number, field: 0 | 1 | 2 | 3, val: string) => {
    const n = Number(val)
    patch({
      candlestick_data: data.map((row, idx) =>
        idx === i
          ? (row.map((v, fi) => (fi === field ? n : v)) as [number, number, number, number])
          : row,
      ),
    })
  }
  const add = () =>
    patch({
      categories: [...cats, `Day ${cats.length + 1}`],
      candlestick_data: [...data, [100, 110, 95, 115]],
    })
  const remove = (i: number) => {
    if (data.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Point'))
      return
    }
    patch({
      categories: cats.filter((_, idx) => idx !== i),
      candlestick_data: data.filter((_, idx) => idx !== i),
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.dataPoints')}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> {t('echarts.addPoint')}
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldDate')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldOpen')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldClose')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldLow')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldHigh')}</th>
              <th className="w-10 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5">
                  <Input value={cats[i] ?? ''} onChange={(e) => updateCat(i, e.target.value)} className="h-8 w-24" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={row[0]} onChange={(e) => updateField(i, 0, e.target.value)} className="h-8" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={row[1]} onChange={(e) => updateField(i, 1, e.target.value)} className="h-8" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={row[2]} onChange={(e) => updateField(i, 2, e.target.value)} className="h-8" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" value={row[3]} onChange={(e) => updateField(i, 3, e.target.value)} className="h-8" />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove(i)} aria-label={t('actions.delete')}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Boxplot editor — [min, Q1, median, Q3, max][] with categories
// ---------------------------------------------------------------------------
function BoxplotDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const cats = config.categories ?? []
  const data = config.boxplot_data ?? []

  const updateCat = (i: number, val: string) =>
    patch({ categories: cats.map((c, idx) => (idx === i ? val : c)) })
  const updateField = (i: number, field: 0 | 1 | 2 | 3 | 4, val: string) => {
    const n = Number(val)
    patch({
      boxplot_data: data.map((row, idx) =>
        idx === i
          ? (row.map((v, fi) => (fi === field ? n : v)) as [number, number, number, number, number])
          : row,
      ),
    })
  }
  const add = () =>
    patch({
      categories: [...cats, `Group ${cats.length + 1}`],
      boxplot_data: [...data, [40, 55, 70, 85, 100]],
    })
  const remove = (i: number) => {
    if (data.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Point'))
      return
    }
    patch({
      categories: cats.filter((_, idx) => idx !== i),
      boxplot_data: data.filter((_, idx) => idx !== i),
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.dataPoints')}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> {t('echarts.addPoint')}
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemName')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldMin')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldQ1')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldMedian')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldQ3')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldMax')}</th>
              <th className="w-10 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5">
                  <Input value={cats[i] ?? ''} onChange={(e) => updateCat(i, e.target.value)} className="h-8 w-24" />
                </td>
                {[0, 1, 2, 3, 4].map((fi) => (
                  <td key={fi} className="px-2 py-1.5">
                    <Input type="number" value={row[fi]} onChange={(e) => updateField(i, fi as 0 | 1 | 2 | 3 | 4, e.target.value)} className="h-8" />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right">
                  <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove(i)} aria-label={t('actions.delete')}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Graph editor — nodes {id, name, category} + links {source, target}
// ---------------------------------------------------------------------------
function GraphDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const nodes = config.graph_nodes ?? []
  const links = config.graph_links ?? []

  const updateNode = (i: number, key: 'id' | 'name' | 'category', val: string) =>
    patch({
      graph_nodes: nodes.map((n, idx) =>
        idx === i
          ? { ...n, [key]: key === 'category' ? Number(val) || 0 : val }
          : n,
      ),
    })
  const addNode = () =>
    patch({
      graph_nodes: [...nodes, { id: String(nodes.length + 1), name: `Node ${nodes.length + 1}`, category: 0 }],
    })
  const removeNode = (i: number) => {
    if (nodes.length <= 2) {
      toast.error(t('echarts.keepAtLeast2Items'))
      return
    }
    const removedId = nodes[i].id
    patch({
      graph_nodes: nodes.filter((_, idx) => idx !== i),
      graph_links: links.filter((l) => l.source !== removedId && l.target !== removedId),
    })
  }
  const updateLink = (i: number, key: 'source' | 'target', val: string) =>
    patch({ graph_links: links.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)) })
  const addLink = () => {
    if (nodes.length < 2) return
    patch({ graph_links: [...links, { source: nodes[0].id, target: nodes[1].id }] })
  }
  const removeLink = (i: number) => {
    if (links.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Link'))
      return
    }
    patch({ graph_links: links.filter((_, idx) => idx !== i) })
  }

  const idOptions = nodes.map((n) => n.id)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.nodes')}</Label>
          <Button size="sm" variant="outline" onClick={addNode}>
            <Plus className="size-3.5" /> {t('echarts.addNode')}
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">ID</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemName')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldCategory')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5"><Input value={n.id} onChange={(e) => updateNode(i, 'id', e.target.value)} className="h-8 w-16" /></td>
                  <td className="px-2 py-1.5"><Input value={n.name} onChange={(e) => updateNode(i, 'name', e.target.value)} className="h-8" /></td>
                  <td className="px-2 py-1.5"><Input type="number" value={n.category} onChange={(e) => updateNode(i, 'category', e.target.value)} className="h-8 w-16" /></td>
                  <td className="px-2 py-1.5 text-right">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeNode(i)} aria-label={t('actions.delete')}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.links')}</Label>
          <Button size="sm" variant="outline" onClick={addLink} disabled={nodes.length < 2}>
            <Plus className="size-3.5" /> {t('echarts.addLink')}
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldSource')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldTarget')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">
                    <Select value={l.source} onValueChange={(v) => updateLink(i, 'source', v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {idOptions.map((id) => (<SelectItem key={id} value={id}>{id}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Select value={l.target} onValueChange={(v) => updateLink(i, 'target', v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {idOptions.map((id) => (<SelectItem key={id} value={id}>{id}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeLink(i)} aria-label={t('actions.delete')}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sankey editor — nodes {name} + links {source, target, value}
// ---------------------------------------------------------------------------
function SankeyDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const nodes = config.sankey_nodes ?? []
  const links = config.sankey_links ?? []
  const nameOptions = nodes.map((n) => n.name)

  const updateNode = (i: number, val: string) =>
    patch({
      sankey_nodes: nodes.map((n, idx) => (idx === i ? { name: val } : n)),
      sankey_links: links.map((l) => ({
        source: l.source === nodes[i].name ? val : l.source,
        target: l.target === nodes[i].name ? val : l.target,
        value: l.value,
      })),
    })
  const addNode = () =>
    patch({ sankey_nodes: [...nodes, { name: `Node ${nodes.length + 1}` }] })
  const removeNode = (i: number) => {
    if (nodes.length <= 2) {
      toast.error(t('echarts.keepAtLeast2Items'))
      return
    }
    const removedName = nodes[i].name
    patch({
      sankey_nodes: nodes.filter((_, idx) => idx !== i),
      sankey_links: links.filter((l) => l.source !== removedName && l.target !== removedName),
    })
  }
  const updateLink = (i: number, key: 'source' | 'target' | 'value', val: string) =>
    patch({
      sankey_links: links.map((l, idx) =>
        idx === i
          ? { ...l, [key]: key === 'value' ? Number(val) || 0 : val }
          : l,
      ),
    })
  const addLink = () => {
    if (nodes.length < 2) return
    patch({ sankey_links: [...links, { source: nodes[0].name, target: nodes[1].name, value: 1000 }] })
  }
  const removeLink = (i: number) => {
    if (links.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Link'))
      return
    }
    patch({ sankey_links: links.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.nodes')}</Label>
          <Button size="sm" variant="outline" onClick={addNode}>
            <Plus className="size-3.5" /> {t('echarts.addNode')}
          </Button>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemName')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5"><Input value={n.name} onChange={(e) => updateNode(i, e.target.value)} className="h-8" /></td>
                  <td className="px-2 py-1.5 text-right">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeNode(i)} aria-label={t('actions.delete')}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.links')}</Label>
          <Button size="sm" variant="outline" onClick={addLink} disabled={nodes.length < 2}>
            <Plus className="size-3.5" /> {t('echarts.addLink')}
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldSource')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldTarget')}</th>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemValue')}</th>
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">
                    <Select value={l.source} onValueChange={(v) => updateLink(i, 'source', v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {nameOptions.map((nm) => (<SelectItem key={nm} value={nm}>{nm}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Select value={l.target} onValueChange={(v) => updateLink(i, 'target', v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {nameOptions.map((nm) => (<SelectItem key={nm} value={nm}>{nm}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5"><Input type="number" value={l.value} onChange={(e) => updateLink(i, 'value', e.target.value)} className="h-8 w-24" /></td>
                  <td className="px-2 py-1.5 text-right">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeLink(i)} aria-label={t('actions.delete')}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sunburst editor — recursive nested tree {name, value?, children?}
// ---------------------------------------------------------------------------
function SunburstDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const tree = config.sunburst_data ?? []

  // Immutably update a node located at `path` (array of child indices).
  const updateNode = (
    path: number[],
    key: 'name' | 'value',
    val: string,
    nodes: SunburstNode[] = tree,
  ): SunburstNode[] =>
    nodes.map((n, i) => {
      if (i !== path[0]) return n
      if (path.length === 1) {
        return { ...n, [key]: key === 'value' ? Number(val) || 0 : val }
      }
      return { ...n, children: updateNode(path.slice(1), key, val, n.children ?? []) }
    })

  const addChild = (path: number[], nodes: SunburstNode[] = tree): SunburstNode[] =>
    nodes.map((n, i) => {
      if (i !== path[0]) return n
      if (path.length === 1) {
        const child: SunburstNode = { name: `Child ${(n.children?.length ?? 0) + 1}`, value: 10 }
        return { ...n, children: [...(n.children ?? []), child], value: undefined }
      }
      return { ...n, children: addChild(path.slice(1), n.children ?? []) }
    })

  const removeNode = (path: number[], nodes: SunburstNode[] = tree): SunburstNode[] =>
    nodes
      .filter((_, i) => i !== path[0])
      .map((n, i) =>
        i === path[0] && path.length > 1
          ? { ...n, children: removeNode(path.slice(1), n.children ?? []) }
          : n,
      )

  const addRoot = () =>
    patch({ sunburst_data: [...tree, { name: `Root ${tree.length + 1}`, children: [{ name: 'Child 1', value: 10 }] }] })

  const renderNode = (node: SunburstNode, path: number[], depth: number): React.ReactNode => (
    <div key={path.join('-')} style={{ marginLeft: depth * 16 }} className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Input
          value={node.name}
          onChange={(e) => patch({ sunburst_data: updateNode(path, 'name', e.target.value) })}
          className="h-8 flex-1"
        />
        <Input
          type="number"
          value={node.value ?? 0}
          onChange={(e) => patch({ sunburst_data: updateNode(path, 'value', e.target.value) })}
          className="h-8 w-20"
          placeholder={node.children?.length ? t('echarts.fieldValueOptional') : t('echarts.itemValue')}
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-primary"
          onClick={() => patch({ sunburst_data: addChild(path) })}
          title={t('echarts.addChild')}
          aria-label={t('echarts.addChild')}
        >
          <Plus className="size-3.5" />
        </Button>
        {!(depth === 0 && tree.length <= 1) && (
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => patch({ sunburst_data: removeNode(path) })}
            aria-label={t('actions.delete')}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
      {node.children?.map((child, ci) => renderNode(child, [...path, ci], depth + 1))}
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.hierarchy')}</Label>
        <Button size="sm" variant="outline" onClick={addRoot}>
          <Plus className="size-3.5" /> {t('echarts.addRoot')}
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto rounded-md border p-2 space-y-1.5">
        {tree.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">{t('echarts.hierarchyEmpty')}</p>
        ) : (
          tree.map((n, i) => renderNode(n, [i], 0))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Parallel editor — dims: string[] + parallel_data: number[][]
// ---------------------------------------------------------------------------
function ParallelDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const dims = config.parallel_dims ?? []
  const data = config.parallel_data ?? []

  const updateDim = (i: number, val: string) =>
    patch({ parallel_dims: dims.map((d, idx) => (idx === i ? val : d)) })
  const addDim = () => {
    patch({
      parallel_dims: [...dims, `Dim ${dims.length + 1}`],
      parallel_data: data.map((row) => [...row, 0]),
    })
  }
  const removeDim = (i: number) => {
    if (dims.length <= 2) {
      toast.error(t('echarts.keepAtLeast2Items'))
      return
    }
    patch({
      parallel_dims: dims.filter((_, idx) => idx !== i),
      parallel_data: data.map((row) => row.filter((_, idx) => idx !== i)),
    })
  }
  const updateCell = (row: number, col: number, val: string) => {
    const n = Number(val)
    patch({
      parallel_data: data.map((r, ri) =>
        ri === row ? (r.map((v, ci) => (ci === col ? n : v))) : r,
      ),
    })
  }
  const addRow = () =>
    patch({ parallel_data: [...data, dims.map(() => 0)] })
  const removeRow = (i: number) => {
    if (data.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Point'))
      return
    }
    patch({ parallel_data: data.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.dimensions')}</Label>
          <Button size="sm" variant="outline" onClick={addDim}>
            <Plus className="size-3.5" /> {t('echarts.addDimension')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dims.map((d, i) => (
            <div key={i} className="flex items-center gap-1 rounded-md border bg-card px-1.5 py-1">
              <Input value={d} onChange={(e) => updateDim(i, e.target.value)} className="h-7 w-24 border-0 px-1" />
              <Button size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => removeDim(i)} aria-label={t('actions.delete')}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('echarts.dataRecords')}</Label>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="size-3.5" /> {t('echarts.addRecord')}
          </Button>
        </div>
        <div className="max-h-60 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {dims.map((d, i) => (
                  <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{d}</th>
                ))}
                <th className="w-10 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className="border-t">
                  {dims.map((_, ci) => (
                    <td key={ci} className="px-1.5 py-1">
                      <Input type="number" value={row[ci] ?? 0} onChange={(e) => updateCell(ri, ci, e.target.value)} className="h-8 w-20" />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(ri)} aria-label={t('actions.delete')}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ThemeRiver editor — [date, value, name][] (time-series river)
// ---------------------------------------------------------------------------
function ThemeRiverDataEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const data = config.themeriver_data ?? []

  const update = (i: number, field: 0 | 1 | 2, val: string) => {
    patch({
      themeriver_data: data.map((row, idx) =>
        idx === i
          ? (field === 1
              ? ([row[0], Number(val) || 0, row[2]] as [string, number, string])
              : field === 0
                ? [val, row[1], row[2]] as [string, number, string]
                : [row[0], row[1], val] as [string, number, string])
          : row,
      ),
    })
  }
  const add = () => {
    const lastDate = data.length ? data[data.length - 1][0] : '2024-01-01'
    const lastName = data.length ? data[data.length - 1][2] : 'Series 1'
    patch({ themeriver_data: [...data, [lastDate, 100, lastName]] })
  }
  const remove = (i: number) => {
    if (data.length <= 1) {
      toast.error(t('echarts.keepAtLeast1Point'))
      return
    }
    patch({ themeriver_data: data.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('echarts.dataPoints')}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> {t('echarts.addPoint')}
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldDate')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.fieldName')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('echarts.itemValue')}</th>
              <th className="w-10 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5"><Input value={row[0]} onChange={(e) => update(i, 0, e.target.value)} className="h-8 w-32" /></td>
                <td className="px-2 py-1.5"><Input value={row[2]} onChange={(e) => update(i, 2, e.target.value)} className="h-8" /></td>
                <td className="px-2 py-1.5"><Input type="number" value={row[1]} onChange={(e) => update(i, 1, e.target.value)} className="h-8 w-24" /></td>
                <td className="px-2 py-1.5 text-right">
                  <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove(i)} aria-label={t('actions.delete')}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Style toggle row (declared outside to satisfy react-hooks/static-components)
function StyleToggle({
  id,
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
  disabled?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', disabled && 'opacity-50')}>
      <div className="space-y-0.5">
        <Label htmlFor={id} className={cn(disabled && 'cursor-not-allowed')}>
          {label}
        </Label>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

// Style editor
function StyleEditor({ config, patch }: SubEditorProps) {
  const t = useT()
  const type = config.type
  const isBar = type === 'bar'
  const isLine = type === 'line'
  const isPie = type === 'pie'

  const PIE_VARIANTS: { value: NonNullable<EChartsConfig['pie_variant']>; label: string }[] = [
    { value: 'pie', label: t('echarts.variantPie') },
    { value: 'donut', label: t('echarts.variantDonut') },
    { value: 'rose', label: t('echarts.variantRose') },
    { value: 'half', label: t('echarts.variantHalf') },
    { value: 'nested', label: t('echarts.variantNested') },
  ]

  return (
    <div className="space-y-4">
      <StyleToggle
        id="legend"
        label={t('echarts.legend')}
        checked={config.legend}
        onChange={(v) => patch({ legend: v })}
        hint={t('echarts.legendHint')}
      />
      <StyleToggle
        id="stack"
        label={t('echarts.stack')}
        checked={config.stack}
        onChange={(v) => patch({ stack: v })}
        disabled={!isBar && !isLine}
        hint={isBar || isLine ? t('echarts.stackHint') : t('echarts.stackUnavailable')}
      />
      <StyleToggle
        id="smooth"
        label={t('echarts.smooth')}
        checked={config.smooth}
        onChange={(v) => patch({ smooth: v })}
        disabled={!isLine}
        hint={isLine ? t('echarts.smoothHint') : t('echarts.smoothUnavailable')}
      />
      <StyleToggle
        id="horizontal"
        label={t('echarts.horizontal')}
        checked={config.horizontal}
        onChange={(v) => patch({ horizontal: v })}
        disabled={!isBar}
        hint={isBar ? t('echarts.horizontalHint') : t('echarts.horizontalUnavailable')}
      />

      {isPie && (
        <div className="space-y-1.5">
          <Label htmlFor="pie-variant">{t('echarts.pieVariant')}</Label>
          <Select
            value={config.pie_variant ?? 'pie'}
            onValueChange={(v) =>
              patch({ pie_variant: v as EChartsConfig['pie_variant'] })
            }
          >
            <SelectTrigger id="pie-variant" className="w-full">
              <SelectValue placeholder={t('echarts.pieVariant')} />
            </SelectTrigger>
            <SelectContent>
              {PIE_VARIANTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('echarts.pieVariantHint')}
          </p>
        </div>
      )}

      <StyleToggle
        id="label"
        label={t('echarts.showLabel')}
        checked={config.showLabel}
        onChange={(v) => patch({ showLabel: v })}
        hint={t('echarts.showLabelHint')}
      />
      <StyleToggle
        id="toolbox"
        label={t('echarts.showToolbox')}
        checked={config.showToolbox}
        onChange={(v) => patch({ showToolbox: v })}
        hint={t('echarts.showToolboxHint')}
      />

      <div className="space-y-1.5">
        <Label htmlFor="theme">{t('echarts.theme')}</Label>
        <Select value={config.theme} onValueChange={(v) => patch({ theme: v })}>
          <SelectTrigger id="theme" className="w-full">
            <SelectValue placeholder={t('echarts.selectTheme')} />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t('echarts.themeHint')}
        </p>
      </div>
    </div>
  )
}
