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
  Code2,
  AlignLeft,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { EChartsConfig } from '@/types/chart'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
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

function typeNameLabel(type: string): string {
  const map: Record<string, string> = {
    bar: '柱状图',
    line: '折线图',
    pie: '饼图',
    scatter: '散点图',
    radar: '雷达图',
    funnel: '漏斗图',
    gauge: '仪表盘',
    heatmap: '热力图',
  }
  return map[type] ?? type
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EChartsEditorProps {
  config: EChartsConfig | null
  onChange: (cfg: EChartsConfig) => void
  previewRef: React.RefObject<HTMLDivElement | null>
}

// ===========================================================================
// Component
// ===========================================================================

export function EChartsEditor({ config, onChange, previewRef }: EChartsEditorProps) {
  // CDN-loaded echarts — status flips to 'loaded' once the <script> tag from
  // VizLibLoader finishes. We render a loading placeholder until then.
  const { status } = useVizLibs()
  const echartsLoaded = status.echarts === 'loaded'

  // Local "live" config — the editor's source of truth between parent updates.
  const [local, setLocal] = React.useState<EChartsConfig>(() =>
    config ? deepClone(config) : deepClone(DEFAULT_TEMPLATE.defaultConfig),
  )

  // Track which template is currently applied so the 图表类型 Select can show
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
  }, [])

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
      toast.success(`已切换为「${tpl.name}」`)
    },
    [commit, local.title],
  )

  const onTemplateIdChange = React.useCallback(
    (id: string) => {
      const tpl = TEMPLATE_BY_ID[id]
      if (tpl) applyTemplate(tpl, true)
    },
    [applyTemplate],
  )

  // ----- Export handlers -----
  const handleDownloadPNG = React.useCallback(() => {
    if (!chartRef.current) {
      toast.error('图表尚未渲染完成')
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
      toast.success('已下载 PNG 图片')
    } catch {
      toast.error('导出 PNG 失败')
    }
  }, [local.title])

  const handleDownloadJSON = React.useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(local, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${local.title?.text || 'chart'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('已下载配置 JSON')
    } catch {
      toast.error('导出 JSON 失败')
    }
  }, [local])

  const handleCopyOption = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(option, null, 2))
      toast.success('已复制 ECharts option 到剪贴板')
    } catch {
      toast.error('复制失败，请检查浏览器权限')
    }
  }, [option])

  // ----- Random data -----
  const handleRandomData = React.useCallback(() => {
    const t = local.type
    if (t === 'pie' || t === 'funnel') {
      const data = (local.single_series_data ?? []).map((d) => ({
        name: d.name,
        value: Math.floor(Math.random() * 900) + 100,
      }))
      patch({ single_series_data: data })
    } else if (t === 'gauge') {
      const max = Number(local.gauge_max) || 100
      patch({ gauge_value: Math.floor(Math.random() * max) })
    } else if (t === 'scatter') {
      const data = (local.scatter_data ?? []).map(() => [
        Math.floor(Math.random() * 200) + 100,
        Math.floor(Math.random() * 60) + 40,
      ]) as [number, number][]
      patch({ scatter_data: data })
    } else if (t === 'heatmap') {
      const data = local.series_data.map((row) =>
        row.map(() => Math.floor(Math.random() * 50)),
      )
      patch({ series_data: data })
    } else if (t === 'radar') {
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
    toast.success('已生成随机数据')
  }, [local, patch])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      {/* ----------------------- LEFT: Template Gallery ----------------------- */}
      <ResizablePanel defaultSize={20} minSize={14} className="bg-background">
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">模板库</h3>
            <p className="text-xs text-muted-foreground mt-1">
              点击模板即可一键应用，配置会随之刷新。
            </p>
          </div>
          <ScrollArea className="flex-1">
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
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ----------------------- MIDDLE: Preview ----------------------- */}
      <ResizablePanel defaultSize={40} minSize={30} className="bg-muted/20">
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {typeNameLabel(local.type)}
                  </Badge>
                  <span className="text-base">{local.title?.text || '未命名图表'}</span>
                </CardTitle>
                {local.title?.subtext ? (
                  <CardDescription className="mt-1">{local.title.subtext}</CardDescription>
                ) : null}
              </div>
              <Badge variant="outline" className="hidden md:inline-flex">
                实时预览
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-2 sm:p-4">
            <div
              ref={previewRef}
              className="relative h-full min-h-[320px] w-full overflow-hidden rounded-lg bg-background"
            >
              <div
                ref={chartContainerRef}
                style={{ width: '100%', height: '100%' }}
              />
              {!echartsLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">正在加载图表库…</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ----------------------- RIGHT: Config Form ----------------------- */}
      <ResizablePanel defaultSize={40} minSize={30} className="bg-background">
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">配置面板</h3>
            <p className="text-xs text-muted-foreground mt-1">
              所有改动都会即时同步到预览，无需保存按钮。
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              <Accordion
                type="multiple"
                defaultValue={['type', 'title', 'data', 'style', 'export']}
                className="w-full"
              >
                {/* 1. 图表类型 */}
                <AccordionItem value="type">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 font-medium">
                      <BarChart3 className="size-4 text-primary" /> 图表类型
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">切换类型会重置数据示例，但保留标题</Label>
                      <Select value={currentTemplateId} onValueChange={onTemplateIdChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择图表类型" />
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

                {/* 2. 标题 */}
                <AccordionItem value="title">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 font-medium">
                      <AlignLeft className="size-4 text-primary" /> 标题
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="title-text">主标题</Label>
                        <Input
                          id="title-text"
                          value={local.title?.text ?? ''}
                          onChange={(e) =>
                            patch({ title: { ...local.title, text: e.target.value } })
                          }
                          placeholder="例如：季度销售额对比"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="title-sub">副标题</Label>
                        <Input
                          id="title-sub"
                          value={local.title?.subtext ?? ''}
                          onChange={(e) =>
                            patch({ title: { ...local.title, subtext: e.target.value } })
                          }
                          placeholder="可选，例如：单位 / 来源说明"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">主副标题会显示在预览区顶部居中位置。</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. 数据 */}
                <AccordionItem value="data">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 font-medium">
                      <Plus className="size-4 text-primary" /> 数据
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

                {/* 4. 样式 */}
                <AccordionItem value="style">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 font-medium">
                      <Activity className="size-4 text-primary" /> 样式
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <StyleEditor config={local} patch={patch} />
                  </AccordionContent>
                </AccordionItem>

                {/* 5. 导出 */}
                <AccordionItem value="export">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 font-medium">
                      <Download className="size-4 text-primary" /> 导出
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        PNG 适合插入文档；JSON 可下次导入继续编辑；option JSON 适合开发者直接调用。
                      </p>
                      <Button onClick={handleDownloadPNG} className="w-full" variant="default">
                        <Download className="size-4" /> 下载 PNG
                      </Button>
                      <Button onClick={handleDownloadJSON} className="w-full" variant="outline">
                        <Download className="size-4" /> 下载 JSON
                      </Button>
                      <Button onClick={handleCopyOption} className="w-full" variant="outline">
                        <Copy className="size-4" /> 复制 ECharts option
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </div>
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
  const t = config.type
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t === 'pie' || t === 'funnel'
            ? '编辑各项名称与数值，左侧为名称右侧为值。'
            : t === 'radar'
              ? '编辑维度（最大值）与每个系列的取值。'
              : t === 'gauge'
                ? '拖动滑块设定仪表盘当前值。'
                : t === 'scatter'
                  ? '编辑每个数据点的 (X, Y) 坐标。'
                  : t === 'heatmap'
                    ? '编辑矩阵：每行代表一个 Y 轴项，每列对应 X 轴的类别。'
                    : '编辑类别与各系列数值，数值用英文逗号分隔。'}
        </p>
        <Button size="sm" variant="secondary" onClick={onRandom} className="shrink-0">
          <Shuffle className="size-3.5" /> 随机数据
        </Button>
      </div>

      {t === 'pie' || t === 'funnel' ? (
        <SingleSeriesEditor config={config} patch={patch} />
      ) : t === 'radar' ? (
        <RadarDataEditor config={config} patch={patch} />
      ) : t === 'gauge' ? (
        <GaugeDataEditor config={config} patch={patch} />
      ) : t === 'scatter' ? (
        <ScatterDataEditor config={config} patch={patch} />
      ) : t === 'heatmap' ? (
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
      series_names: [...series_names, `系列 ${series_names.length + 1}`],
      series_data: [...series_data, newRow],
    })
  }

  const removeSeries = (i: number) => {
    if (series_names.length <= 1) {
      toast.error('至少需要保留 1 个系列')
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
          <Label>类别（X 轴，逗号分隔）</Label>
          <Input
            value={categories.join(', ')}
            onChange={(e) => {
              const arr = e.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean)
              patch({ categories: arr })
            }}
            placeholder="例如：Q1, Q2, Q3, Q4"
          />
          <p className="text-xs text-muted-foreground">
            修改类别数量后，每个系列的数值数量会自动适配。
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>系列数据</Label>
          <Button size="sm" variant="outline" onClick={addSeries}>
            <Plus className="size-3.5" /> 添加系列
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">系列名</th>
                <th className="px-2 py-1.5 text-left font-medium">数值（逗号分隔）</th>
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
                      aria-label="删除该系列"
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
            提示：类别对应 X 轴，例如季度或月份；系列对应不同的数据线/柱。
          </p>
        )}
      </div>
    </div>
  )
}

// Pie / funnel editor
function SingleSeriesEditor({ config, patch }: SubEditorProps) {
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
      single_series_data: [...data, { name: `项 ${data.length + 1}`, value: 100 }],
    })
  const remove = (i: number) => {
    if (data.length <= 2) {
      toast.error('至少需要保留 2 项')
      return
    }
    patch({ single_series_data: data.filter((_, idx) => idx !== i) })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>数据项</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> 添加项
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">名称</th>
              <th className="px-2 py-1.5 text-left font-medium">数值</th>
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
                    aria-label="删除该项"
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
      radar_indicators: [...indicators, { name: `维度 ${indicators.length + 1}`, max: 100 }],
      series_data: series_data.map((row) => [...row, 0]),
    })
  const removeIndicator = (i: number) => {
    if (indicators.length <= 3) {
      toast.error('雷达图至少需要 3 个维度')
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
          <Label>维度（指标）</Label>
          <Button size="sm" variant="outline" onClick={addIndicator}>
            <Plus className="size-3.5" /> 添加维度
          </Button>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">维度名</th>
                <th className="px-2 py-1.5 text-left font-medium">最大值</th>
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
                      aria-label="删除该维度"
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
        <Label>各系列取值（按维度顺序，逗号分隔）</Label>
        <div className="max-h-44 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">系列名</th>
                <th className="px-2 py-1.5 text-left font-medium">取值</th>
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
          <Label>当前值</Label>
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
        <Label htmlFor="gauge-max">最大值</Label>
        <Input
          id="gauge-max"
          type="number"
          value={max}
          onChange={(e) => patch({ gauge_max: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">仪表盘刻度从 0 到最大值，通常设为 100 表示百分比。</p>
      </div>
    </div>
  )
}

// Scatter editor
function ScatterDataEditor({ config, patch }: SubEditorProps) {
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
      toast.error('至少需要保留 1 个数据点')
      return
    }
    patch({ scatter_data: data.filter((_, idx) => idx !== i) })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>数据点</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" /> 添加点
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
                    aria-label="删除该点"
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
  const t = config.type
  const isBar = t === 'bar'
  const isLine = t === 'line'

  return (
    <div className="space-y-4">
      <StyleToggle
        id="legend"
        label="显示图例"
        checked={config.legend}
        onChange={(v) => patch({ legend: v })}
        hint="在底部展示各系列的颜色说明。"
      />
      <StyleToggle
        id="stack"
        label="堆叠"
        checked={config.stack}
        onChange={(v) => patch({ stack: v })}
        disabled={!isBar && !isLine}
        hint={isBar || isLine ? '将多系列堆叠展示总量。' : '仅柱状图 / 折线图可用。'}
      />
      <StyleToggle
        id="smooth"
        label="平滑曲线"
        checked={config.smooth}
        onChange={(v) => patch({ smooth: v })}
        disabled={!isLine}
        hint={isLine ? '折线变成圆滑曲线。' : '仅折线图可用。'}
      />
      <StyleToggle
        id="horizontal"
        label="横向显示"
        checked={config.horizontal}
        onChange={(v) => patch({ horizontal: v })}
        disabled={!isBar}
        hint={isBar ? '将 X/Y 轴对调，柱子变为横向。' : '仅柱状图可用。'}
      />
      <StyleToggle
        id="label"
        label="显示数值标签"
        checked={config.showLabel}
        onChange={(v) => patch({ showLabel: v })}
        hint="在数据点上直接显示数值。"
      />
      <StyleToggle
        id="toolbox"
        label="显示工具栏"
        checked={config.showToolbox}
        onChange={(v) => patch({ showToolbox: v })}
        hint="右上角悬浮工具：保存图片、数据视图等。"
      />

      <div className="space-y-1.5">
        <Label htmlFor="theme">主题</Label>
        <Select value={config.theme} onValueChange={(v) => patch({ theme: v })}>
          <SelectTrigger id="theme" className="w-full">
            <SelectValue placeholder="选择主题" />
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
          切换主题会重新初始化图表实例以套用主题样式。
        </p>
      </div>
    </div>
  )
}
