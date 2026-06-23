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
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { EChartsConfig } from '@/types/chart'
import { useT } from '@/lib/i18n'
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
  // the right value. Initialized from the first template; updated whenever the
  // user picks a template from the gallery or dropdown. When the parent pushes
  // a config (AI suggestion / loaded chart) we best-effort match by template id
  // — if we can't, we fall back to the first template whose type matches.
  const [currentTemplateId, setCurrentTemplateId] = React.useState<string>(
    DEFAULT_TEMPLATE.id,
  )

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
  }, [isMobile])

  // Force a re-render after the layout switches so the freshly mounted
  // chart container gets the option applied.
  React.useEffect(() => {
    if (!echartsLoaded) return
    const id = window.setTimeout(() => renderChart(), 50)
    return () => window.clearTimeout(id)
  }, [isMobile, renderChart, echartsLoaded])

  // ----- Mutators (keep immutable) -----
  const patch = React.useCallback(
    (p: Partial<EChartsConfig>) => commit({ ...local, ...p }),
    [commit, local],
  )

  const applyTemplate = React.useCallback(
    (tpl: EChartsTemplate, keepTitle = false) => {
      const next = deepClone(tpl.defaultConfig)
      if (keepTitle && local.title) next.title = deepClone(local.title)
      commit(next)
      setCurrentTemplateId(tpl.id)
      onTemplateChange?.('echarts:' + tpl.id)
      toast.success(t('toasts.applied', { name: tpl.name }))
    },
    [commit, local.title, t, onTemplateChange],
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
      const a = document.createElement('a')
      a.href = url
      a.download = `${local.title?.text || 'chart'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(t('toasts.exported'))
    } catch {
      toast.error(t('toasts.exportFailed', { error: 'PNG' }))
    }
  }, [local.title, t])

  // Render the option into a hidden, off-screen SVG-renderer ECharts instance
  // and serialize the resulting SVG. The live preview uses the canvas renderer
  // (which can't produce SVG), so we spin up a temporary SVG-renderer instance
  // with the same option / size / theme, grab its <svg>, and tear it down.
  const handleDownloadSvg = React.useCallback(() => {
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
  }, [option, local.theme, local.title, t])

  const handleCopyAsMarkdown = React.useCallback(async () => {
    try {
      const markdown = '```echarts\n' + JSON.stringify(option, null, 2) + '\n```'
      await navigator.clipboard.writeText(markdown)
      toast.success(t('toasts.markdownCopied'))
    } catch {
      toast.error(t('toasts.copyFailed'))
    }
  }, [option, t])

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
          Click a template to apply it; the config panel refreshes accordingly.
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
                  {cat.label}
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
                      title={tpl.description}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm font-medium">{tpl.name}</span>
                        <span className="line-clamp-2 text-[11px] text-muted-foreground">
                          {tpl.description}
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

  const previewEl = (
    <div className="flex h-full flex-col">
      {/* Toolbar — unified across all editors (zoom left, export right) */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            aria-label="Zoom out"
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
            aria-label="Zoom in"
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            aria-label="Reset zoom"
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
        </div>
      </div>

      {/* Canvas */}
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
    </div>
  )

  const configEl = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t('echarts.configPanel')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          All changes sync to the preview instantly — no save button needed.
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
                  <Label className="text-xs text-muted-foreground">Switching type resets sample data but keeps the title</Label>
                  <Select value={currentTemplateId} onValueChange={onTemplateIdChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ECHARTS_TEMPLATE_CATEGORIES.map((cat) => {
                        const items = ECHARTS_TEMPLATES.filter((t) => t.category === cat.id)
                        if (items.length === 0) return null
                        return (
                          <SelectGroup key={cat.id}>
                            <SelectLabel>{cat.label}</SelectLabel>
                            {items.map((tpl) => (
                              <SelectItem key={tpl.id} value={tpl.id}>
                                {tpl.name}
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
                      placeholder="e.g. Quarterly Sales Comparison"
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
                      placeholder="Optional, e.g. unit / source"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Main and sub titles appear centered at the top of the preview.</p>
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
      <Tabs defaultValue="preview" className="flex h-full w-full flex-col gap-0">
        <TabsList className="grid h-10 w-full shrink-0 grid-cols-3 rounded-none border-b">
          <TabsTrigger value="templates" className="text-xs">
            {t('echarts.templateGallery')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            Preview
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
    )
  }

  // Desktop: horizontal resizable panels
  return (
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
            ? 'Edit each item name and value — left is name, right is value.'
            : type === 'radar'
              ? 'Edit dimensions (max) and each series values.'
              : type === 'gauge'
                ? 'Drag the slider to set the current gauge value.'
                : type === 'scatter'
                  ? 'Edit the (X, Y) coordinates of each data point.'
                  : type === 'heatmap'
                    ? 'Edit the matrix: each row is a Y-axis item, each column an X-axis category.'
                    : 'Edit categories and per-series values, comma-separated.'}
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
      toast.error('Keep at least 1 series')
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
            placeholder="e.g. Q1, Q2, Q3, Q4"
          />
          <p className="text-xs text-muted-foreground">
            When the category count changes, each series values array auto-resizes.
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
            Tip: categories are on the X-axis (quarters, months); series are different bars/lines.
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
      toast.error('Keep at least 2 items')
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
      toast.error('Radar needs at least 3 dimensions')
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
          <Label>Dimensions (Indicators)</Label>
          <Button size="sm" variant="outline" onClick={addIndicator}>
            <Plus className="size-3.5" /> Add dimension
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Dimension</th>
                <th className="px-2 py-1.5 text-left font-medium">Max</th>
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
        <Label>Series values (in dimension order, comma-separated)</Label>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">{t('echarts.seriesName')}</th>
                <th className="px-2 py-1.5 text-left font-medium">Values</th>
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
  const value = Number(config.gauge_value) || 0
  const max = Number(config.gauge_max) || 100
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Current value</Label>
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
        <Label htmlFor="gauge-max">Max</Label>
        <Input
          id="gauge-max"
          type="number"
          value={max}
          onChange={(e) => patch({ gauge_max: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">Gauge scale goes from 0 to max — usually 100 for percentage.</p>
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
      toast.error('Keep at least 1 data point')
      return
    }
    patch({ scatter_data: data.filter((_, idx) => idx !== i) })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Data points</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> Add point
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

  return (
    <div className="space-y-4">
      <StyleToggle
        id="legend"
        label={t('echarts.legend')}
        checked={config.legend}
        onChange={(v) => patch({ legend: v })}
        hint="Show color legend for each series at the bottom."
      />
      <StyleToggle
        id="stack"
        label={t('echarts.stack')}
        checked={config.stack}
        onChange={(v) => patch({ stack: v })}
        disabled={!isBar && !isLine}
        hint={isBar || isLine ? 'Stack multiple series to show totals.' : 'Only available for bar / line charts.'}
      />
      <StyleToggle
        id="smooth"
        label={t('echarts.smooth')}
        checked={config.smooth}
        onChange={(v) => patch({ smooth: v })}
        disabled={!isLine}
        hint={isLine ? 'Smooth the line into a curve.' : 'Only available for line charts.'}
      />
      <StyleToggle
        id="horizontal"
        label={t('echarts.horizontal')}
        checked={config.horizontal}
        onChange={(v) => patch({ horizontal: v })}
        disabled={!isBar}
        hint={isBar ? 'Swap X/Y axes to make bars horizontal.' : 'Only available for bar charts.'}
      />
      <StyleToggle
        id="label"
        label={t('echarts.showLabel')}
        checked={config.showLabel}
        onChange={(v) => patch({ showLabel: v })}
        hint="Show values directly on data points."
      />
      <StyleToggle
        id="toolbox"
        label={t('echarts.showToolbox')}
        checked={config.showToolbox}
        onChange={(v) => patch({ showToolbox: v })}
        hint="Floating toolbar (top-right): save image, data view, etc."
      />

      <div className="space-y-1.5">
        <Label htmlFor="theme">{t('echarts.theme')}</Label>
        <Select value={config.theme} onValueChange={(v) => patch({ theme: v })}>
          <SelectTrigger id="theme" className="w-full">
            <SelectValue placeholder="Select theme" />
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
          Switching theme re-initializes the chart instance to apply theme styles.
        </p>
      </div>
    </div>
  )
}
