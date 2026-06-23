'use client'

import * as React from 'react'
import { useVizLibs, getInfographic } from '@/lib/viz-libs/cdn-loader'
import { toast } from 'sonner'
import {
  Download,
  Copy,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  Wand2,
  LayoutGrid,
  Rows3,
  Columns3,
  Triangle,
  PieChart,
  Waves,
  Spline,
  GitCommitHorizontal,
  ListOrdered,
  Map as MapIcon,
  CircleDot,
  Filter,
  ArrowRightLeft,
  TrendingUp,
  Database,
  Mountain,
  Grid3x3,
  RefreshCw,
  Circle,
  Columns2,
  Split,
  Grid2x2,
  Network,
  Share2,
  BarChart3,
  BarChartHorizontal,
  LineChart,
  Cloud,
  Square,
  Search,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type {
  InfographicConfig,
  InfographicData,
  InfographicItem,
  InfographicRelationNode,
  InfographicRelationEdge,
} from '@/types/chart'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ScrollArea,
} from '@/components/ui/scroll-area'
import {
  TEMPLATE_REGISTRY,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  groupTemplatesByCategory,
  defaultDataForShape,
  type TemplateMeta,
  type InfographicTemplateCategory,
} from './template-registry'
import { exportSvg, exportJson } from '@/lib/chart/export'

// Icon registry — maps template icon names to lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rows3, LayoutGrid, Columns3, Triangle, PieChart, Waves, Spline,
  'GitCommitHorizontal': GitCommitHorizontal, ListOrdered, 'Map': MapIcon,
  CircleDot, Filter, ArrowRightLeft, TrendingUp, Database, Mountain,
  Grid3x3, RefreshCw, Circle, Columns2, Split, 'Grid2x2': Grid2x2,
  Network, Share2, 'BarChart3': BarChart3, 'BarChartHorizontal': BarChartHorizontal,
  'LineChart': LineChart, Cloud, Square,
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[name] ?? Square
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InfographicEditorProps {
  config: InfographicConfig | null
  onChange: (cfg: InfographicConfig) => void
  previewRef: React.RefObject<HTMLDivElement | null>
}

// ===========================================================================
// Main component
// ===========================================================================

export function InfographicEditor({ config, onChange, previewRef }: InfographicEditorProps) {
  const [local, setLocal] = React.useState<InfographicConfig>(() =>
    config
      ? deepClone(config)
      : {
          type: TEMPLATE_REGISTRY[0].id,
          template: TEMPLATE_REGISTRY[0].id,
          data: defaultDataForShape(TEMPLATE_REGISTRY[0].dataShape),
          theme: 'light',
          background: '#ffffff',
          width: 900,
          height: 600,
        },
  )
  const lastAppliedKey = React.useRef<string>('')

  // Sync parent -> local
  React.useEffect(() => {
    if (!config) return
    const key = JSON.stringify(config)
    if (key !== lastAppliedKey.current) {
      lastAppliedKey.current = key
      setLocal(deepClone(config))
    }
  }, [config])

  // Sync local -> parent (debounced 200ms)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const key = JSON.stringify(local)
      if (key !== lastAppliedKey.current) {
        lastAppliedKey.current = key
        onChange(deepClone(local))
      }
    }, 200)
    return () => clearTimeout(t)
  }, [local, onChange])

  const update = React.useCallback((patch: Partial<InfographicConfig>) => {
    setLocal((prev) => ({ ...prev, ...patch }))
  }, [])

  const applyTemplate = React.useCallback((tpl: TemplateMeta) => {
    setLocal((prev) => ({
      ...prev,
      type: tpl.id,
      template: tpl.id,
      data: defaultDataForShape(tpl.dataShape),
    }))
    toast.success(`已应用模板：${tpl.name}`)
  }, [])

  const currentTemplate = React.useMemo(
    () => TEMPLATE_REGISTRY.find((t) => t.id === local.template) ?? TEMPLATE_REGISTRY[0],
    [local.template],
  )

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* ---------------- Left: Template gallery ---------------- */}
      <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
        <TemplateGallery
          currentId={local.template}
          onPick={applyTemplate}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ---------------- Middle: Preview ---------------- */}
      <ResizablePanel defaultSize={42} minSize={30}>
        <PreviewPanel
          config={local}
          previewRef={previewRef}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ---------------- Right: Data & style ---------------- */}
      <ResizablePanel defaultSize={30} minSize={22}>
        <ConfigPanel
          config={local}
          template={currentTemplate}
          update={update}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

// ===========================================================================
// Template gallery (left)
// ===========================================================================

interface GalleryProps {
  currentId: string
  onPick: (tpl: TemplateMeta) => void
}

function TemplateGallery({ currentId, onPick }: GalleryProps) {
  const [keyword, setKeyword] = React.useState('')
  const groups = React.useMemo(() => groupTemplatesByCategory(), [])

  const filtered = React.useMemo(() => {
    if (!keyword.trim()) return null
    const kw = keyword.toLowerCase()
    return TEMPLATE_REGISTRY.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.id.toLowerCase().includes(kw) ||
        t.tags.some((tag) => tag.toLowerCase().includes(kw)),
    )
  }, [keyword])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">信息图模板</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索模板…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {filtered ? (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((t) => (
                <TemplateCard
                  key={t.id}
                  tpl={t}
                  active={t.id === currentId}
                  onClick={() => onPick(t)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                  没有匹配的模板
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORY_ORDER.map((cat) => {
                const list = groups[cat]
                if (!list || list.length === 0) return null
                return (
                  <section key={cat}>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">
                        {CATEGORY_LABEL[cat]}
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {list.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {list.map((t) => (
                        <TemplateCard
                          key={t.id}
                          tpl={t}
                          active={t.id === currentId}
                          onClick={() => onPick(t)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface CardProps {
  tpl: TemplateMeta
  active: boolean
  onClick: () => void
}

function TemplateCard({ tpl, active, onClick }: CardProps) {
  const iconKey = tpl.id.split('-').slice(0, 2).join('-')
  const IconComponent = (getIcon(iconKey) || getIcon(tpl.id.split('-')[0]) || Square) as React.FC<{ className?: string }>
  return (
    <button
      onClick={onClick}
      title={tpl.description}
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-all',
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'hover:border-foreground/30 hover:bg-muted/50',
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md',
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="text-xs font-medium leading-tight">{tpl.name}</div>
    </button>
  )
}

// ===========================================================================
// Preview (middle)
// ===========================================================================

interface PreviewProps {
  config: InfographicConfig
  previewRef: React.RefObject<HTMLDivElement | null>
}

function PreviewPanel({ config, previewRef }: PreviewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  // `any` because the @antv/infographic types aren't resolvable now that the
  // library is externalized to a CDN global. The runtime API (constructor,
  // render, destroy) is identical to the bundled build.
  const engineRef = React.useRef<any>(null)
  const [zoom, setZoom] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const renderSeq = React.useRef(0)

  // Infographic engine is loaded from CDN via <VizLibLoader>. Wait for the
  // `loaded` status before constructing the engine.
  const { status } = useVizLibs()
  const infographicLoaded = status.infographic === 'loaded'

  // Create / destroy engine — gated on CDN load. Re-creates when status flips.
  React.useEffect(() => {
    if (!containerRef.current || !infographicLoaded) return
    const InfographicEngine = getInfographic()
    if (!InfographicEngine) return
    try {
      engineRef.current = new InfographicEngine({
        container: containerRef.current,
        width: '100%',
        height: '100%',
        editable: false,
      })
    } catch (e) {
      console.error('Infographic init error', e)
      setError((e as Error).message)
    }
    return () => {
      try {
        engineRef.current?.destroy()
      } catch {
        // ignore
      }
      engineRef.current = null
    }
  }, [infographicLoaded])

  // Render on config change (debounced 250ms) — gated on CDN load.
  React.useEffect(() => {
    if (!infographicLoaded) return
    const seq = ++renderSeq.current
    const t = setTimeout(() => {
      if (!engineRef.current || renderSeq.current !== seq) return
      try {
        engineRef.current.render({
          template: config.template,
          data: config.data,
          theme: config.theme,
        })
        setError(null)
      } catch (e) {
        console.error('Infographic render error', e)
        setError((e as Error).message)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [config.template, config.data, config.theme, infographicLoaded])

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2))
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2))
  const handleReset = () => setZoom(1)

  const handleDownloadSvg = async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) {
      toast.error('暂无可导出的内容')
      return
    }
    // Add background rect if needed
    const clone = svg.cloneNode(true) as SVGSVGElement
    if (config.background && config.background !== 'transparent') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', config.background)
      clone.insertBefore(rect, clone.firstChild)
    }
    exportSvg(clone, `infographic-${Date.now()}.svg`)
    toast.success('SVG 已下载')
  }

  const handleDownloadPng = async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) {
      toast.error('暂无可导出的内容')
      return
    }
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement
      const bbox = svg.getBoundingClientRect()
      const w = Math.max(100, bbox.width)
      const h = Math.max(100, bbox.height)
      clone.setAttribute('width', String(w))
      clone.setAttribute('height', String(h))
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      if (config.background && config.background !== 'transparent') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('width', '100%')
        rect.setAttribute('height', '100%')
        rect.setAttribute('fill', config.background)
        clone.insertBefore(rect, clone.firstChild)
      }
      const str = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = 2
        canvas.width = w * scale
        canvas.height = h * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = config.background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        canvas.toBlob((b) => {
          if (!b) return
          const a = document.createElement('a')
          a.href = URL.createObjectURL(b)
          a.download = `infographic-${Date.now()}.png`
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        }, 'image/png')
        toast.success('PNG 已下载')
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        toast.error('PNG 导出失败')
      }
      img.src = url
    } catch (e) {
      toast.error('PNG 导出失败：' + (e as Error).message)
    }
  }

  const handleExportJson = () => {
    exportJson(config, `infographic-config-${Date.now()}.json`)
    toast.success('配置已导出')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={handleZoomOut} className="h-7 w-7 p-0">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="sm" variant="ghost" onClick={handleZoomIn} className="h-7 w-7 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 w-7 p-0">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleDownloadSvg} className="h-7 gap-1 px-2 text-xs">
            <Download className="h-3 w-3" /> SVG
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDownloadPng} className="h-7 gap-1 px-2 text-xs">
            <Download className="h-3 w-3" /> PNG
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportJson} className="h-7 gap-1 px-2 text-xs">
            <Copy className="h-3 w-3" /> JSON
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={previewRef}
        className="relative flex-1 overflow-auto p-4"
        style={{ background: config.background }}
      >
        <div
          className="mx-auto flex min-h-full w-full items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
        >
          <div
            ref={containerRef}
            className="h-full w-full"
            style={{ minHeight: 400 }}
          />
        </div>
        {!infographicLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">正在加载图表库…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <div className="mb-1 font-semibold">渲染出错</div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// Config panel (right)
// ===========================================================================

interface ConfigProps {
  config: InfographicConfig
  template: TemplateMeta
  update: (patch: Partial<InfographicConfig>) => void
}

function ConfigPanel({ config, template, update }: ConfigProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        {/* Template info */}
        <section className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {CATEGORY_LABEL[template.category]}
            </Badge>
            <h3 className="text-sm font-semibold">{template.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </section>

        {/* Title */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">标题</h4>
          <div className="grid gap-2">
            <Input
              value={config.data.title?.text ?? ''}
              onChange={(e) =>
                update({
                  data: {
                    ...config.data,
                    title: {
                      ...(config.data.title ?? {}),
                      text: e.target.value,
                    },
                  },
                })
              }
              placeholder="主标题"
              className="h-8 text-xs"
            />
            <Input
              value={config.data.title?.subtext ?? ''}
              onChange={(e) =>
                update({
                  data: {
                    ...config.data,
                    title: {
                      ...(config.data.title ?? {}),
                      subtext: e.target.value,
                    },
                  },
                })
              }
              placeholder="副标题（可选）"
              className="h-8 text-xs"
            />
          </div>
        </section>

        {/* Data editor — switch by data shape */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">数据</h4>
          {template.dataShape === 'relation' ? (
            <RelationDataEditor config={config} update={update} />
          ) : template.dataShape === 'hierarchy' ? (
            <HierarchyDataEditor config={config} update={update} />
          ) : template.dataShape === 'compare' ? (
            <CompareDataEditor config={config} update={update} />
          ) : (
            <ListDataEditor config={config} update={update} />
          )}
        </section>

        {/* Theme & background */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">样式</h4>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-1.5">
              {(['light', 'dark', 'hand-drawn'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => update({ theme: th })}
                  className={cn(
                    'rounded-md border py-1.5 text-xs transition-all',
                    config.theme === th
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  {th === 'light' ? '亮色' : th === 'dark' ? '暗色' : '手绘'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="w-16 text-xs">背景色</Label>
              <Input
                type="color"
                value={config.background}
                onChange={(e) => update({ background: e.target.value })}
                className="h-8 w-10 cursor-pointer p-1"
              />
              <Input
                value={config.background}
                onChange={(e) => update({ background: e.target.value })}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  )
}

// ---------------------------------------------------------------------------
// List / sequence / chart data editor
// ---------------------------------------------------------------------------

function ListDataEditor({
  config,
  update,
}: {
  config: InfographicConfig
  update: (patch: Partial<InfographicConfig>) => void
}) {
  const items = config.data.lists ?? []

  const setItems = (next: InfographicItem[]) => {
    update({ data: { ...config.data, lists: next } })
  }

  const add = () => {
    setItems([
      ...items,
      { label: `新条目 ${items.length + 1}`, desc: '', value: 50, icon: '📍' },
    ])
  }

  const updateItem = (i: number, patch: Partial<InfographicItem>) => {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const remove = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i))
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
  }

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-md border p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={it.icon ?? ''}
              onChange={(e) => updateItem(i, { icon: e.target.value })}
              placeholder="图标"
              className="h-7 w-12 text-center text-xs"
            />
            <Input
              value={it.label ?? ''}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              placeholder="标题"
              className="h-7 flex-1 text-xs"
            />
            <Button size="sm" variant="ghost" onClick={() => move(i, -1)} className="h-7 w-6 p-0" disabled={i === 0}>
              ↑
            </Button>
            <Button size="sm" variant="ghost" onClick={() => move(i, 1)} className="h-7 w-6 p-0" disabled={i === items.length - 1}>
              ↓
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(i)} className="h-7 w-6 p-0 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={it.desc ?? ''}
            onChange={(e) => updateItem(i, { desc: e.target.value })}
            placeholder="描述（可选）"
            className="h-7 text-xs"
          />
          {(it.value !== undefined) && (
            <div className="flex items-center gap-1.5">
              <Label className="w-10 text-[10px] text-muted-foreground">数值</Label>
              <Input
                type="number"
                value={it.value ?? 0}
                onChange={(e) => updateItem(i, { value: Number(e.target.value) })}
                className="h-7 flex-1 text-xs"
              />
            </div>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add} className="w-full gap-1 text-xs">
        <Plus className="h-3 w-3" /> 添加条目
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hierarchy data editor (tree)
// ---------------------------------------------------------------------------

function HierarchyDataEditor({
  config,
  update,
}: {
  config: InfographicConfig
  update: (patch: Partial<InfographicConfig>) => void
}) {
  const root = config.data.lists?.[0]

  const setRoot = (next: InfographicItem) => {
    update({ data: { ...config.data, lists: [next] } })
  }

  if (!root) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        onClick={() => setRoot({ label: '根节点', children: [] })}
      >
        初始化树
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-muted/30 p-2">
        <NodeEditor
          node={root}
          onChange={setRoot}
          depth={0}
        />
      </div>
    </div>
  )
}

function NodeEditor({
  node,
  onChange,
  depth,
}: {
  node: InfographicItem
  onChange: (n: InfographicItem) => void
  depth: number
}) {
  const [expanded, setExpanded] = React.useState(depth < 2)

  const patch = (p: Partial<InfographicItem>) => onChange({ ...node, ...p })

  const addChild = () => {
    const children = [...(node.children ?? []), { label: `新节点 ${(node.children?.length ?? 0) + 1}` }]
    patch({ children })
    if (!expanded) setExpanded(true)
  }

  const removeChild = (i: number) => {
    const children = (node.children ?? []).filter((_, idx) => idx !== i)
    patch({ children })
  }

  const updateChild = (i: number, child: InfographicItem) => {
    const children = (node.children ?? []).map((c, idx) => (idx === i ? child : c))
    patch({ children })
  }

  return (
    <div className="space-y-1.5" style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      <div className="flex items-center gap-1.5">
        {(node.children?.length ?? 0) > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        <Input
          value={node.label ?? ''}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="节点标题"
          className="h-7 flex-1 text-xs"
          style={{ fontWeight: depth === 0 ? 600 : 400 }}
        />
        {depth > 0 && (
          <Button size="sm" variant="ghost" onClick={() => onChange({})} className="h-7 w-6 p-0 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {depth === 0 && (
        <Input
          value={node.desc ?? ''}
          onChange={(e) => patch({ desc: e.target.value })}
          placeholder="根节点描述（可选）"
          className="h-7 text-xs"
        />
      )}
      {expanded && (node.children?.length ?? 0) > 0 && (
        <div className="space-y-1.5 border-l pl-2">
          {node.children!.map((child, i) => (
            <NodeEditor
              key={i}
              node={child}
              onChange={(c) => updateChild(i, c)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={addChild}
        className="h-6 gap-1 text-[10px] text-muted-foreground"
      >
        <Plus className="h-2.5 w-2.5" /> 添加子节点
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compare data editor (2 or 4 groups)
// ---------------------------------------------------------------------------

function CompareDataEditor({
  config,
  update,
}: {
  config: InfographicConfig
  update: (patch: Partial<InfographicConfig>) => void
}) {
  const groups = config.data.lists ?? []

  const setGroups = (next: InfographicItem[]) => {
    update({ data: { ...config.data, lists: next } })
  }

  const addGroup = () => {
    setGroups([...groups, { label: `类别 ${groups.length + 1}`, children: [] }])
  }

  const updateGroup = (i: number, g: InfographicItem) => {
    setGroups(groups.map((gg, idx) => (idx === i ? g : gg)))
  }

  const removeGroup = (i: number) => {
    setGroups(groups.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {groups.map((g, i) => (
        <div key={i} className="rounded-md border p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={g.label ?? ''}
              onChange={(e) => updateGroup(i, { ...g, label: e.target.value })}
              placeholder="组名"
              className="h-7 flex-1 text-xs font-medium"
            />
            <Button size="sm" variant="ghost" onClick={() => removeGroup(i)} className="h-7 w-6 p-0 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={g.desc ?? ''}
            onChange={(e) => updateGroup(i, { ...g, desc: e.target.value })}
            placeholder="组描述（可选）"
            className="h-7 text-xs"
          />
          {/* children */}
          <div className="space-y-1 pl-2 border-l">
            {(g.children ?? []).map((c, j) => (
              <div key={j} className="flex items-center gap-1.5">
                <Input
                  value={c.label ?? ''}
                  onChange={(e) => {
                    const children = [...(g.children ?? [])]
                    children[j] = { ...c, label: e.target.value }
                    updateGroup(i, { ...g, children })
                  }}
                  placeholder="要点"
                  className="h-6 flex-1 text-[11px]"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const children = (g.children ?? []).filter((_, idx) => idx !== j)
                    updateGroup(i, { ...g, children })
                  }}
                  className="h-6 w-5 p-0 text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const children = [...(g.children ?? []), { label: '新要点' }]
                updateGroup(i, { ...g, children })
              }}
              className="h-5 gap-1 text-[10px] text-muted-foreground"
            >
              <Plus className="h-2.5 w-2.5" /> 添加要点
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addGroup} className="w-full gap-1 text-xs">
        <Plus className="h-3 w-3" /> 添加分组
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Relation data editor (nodes + edges)
// ---------------------------------------------------------------------------

function RelationDataEditor({
  config,
  update,
}: {
  config: InfographicConfig
  update: (patch: Partial<InfographicConfig>) => void
}) {
  const nodes = config.data.nodes ?? []
  const edges = config.data.edges ?? []

  const setNodes = (next: InfographicRelationNode[]) => {
    update({ data: { ...config.data, nodes: next } })
  }
  const setEdges = (next: InfographicRelationEdge[]) => {
    update({ data: { ...config.data, edges: next } })
  }

  return (
    <div className="space-y-3">
      {/* Nodes */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">节点 ({nodes.length})</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setNodes([
                ...nodes,
                { id: `n${nodes.length + 1}`, label: `节点 ${nodes.length + 1}` },
              ])
            }
            className="h-6 gap-1 px-1.5 text-[10px]"
          >
            <Plus className="h-2.5 w-2.5" /> 添加
          </Button>
        </div>
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={n.id}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, id: e.target.value } : nn)))}
              placeholder="id"
              className="h-7 w-16 font-mono text-[10px]"
            />
            <Input
              value={n.label}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, label: e.target.value } : nn)))}
              placeholder="名称"
              className="h-7 flex-1 text-xs"
            />
            <Input
              value={n.group ?? ''}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, group: e.target.value } : nn)))}
              placeholder="组"
              className="h-7 w-12 text-[10px]"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNodes(nodes.filter((_, idx) => idx !== i))}
              className="h-7 w-6 p-0 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Edges */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">连线 ({edges.length})</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEdges([...edges, { from: nodes[0]?.id ?? '', to: nodes[1]?.id ?? '' }])}
            className="h-6 gap-1 px-1.5 text-[10px]"
          >
            <Plus className="h-2.5 w-2.5" /> 添加
          </Button>
        </div>
        {edges.map((e, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Select
              value={e.from}
              onValueChange={(v) => setEdges(edges.map((ee, idx) => (idx === i ? { ...ee, from: v } : ee)))}
            >
              <SelectTrigger className="h-7 w-16 text-[10px]">
                <SelectValue placeholder="起点" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id} className="text-[10px]">
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">→</span>
            <Select
              value={e.to}
              onValueChange={(v) => setEdges(edges.map((ee, idx) => (idx === i ? { ...ee, to: v } : ee)))}
            >
              <SelectTrigger className="h-7 w-16 text-[10px]">
                <SelectValue placeholder="终点" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id} className="text-[10px]">
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={e.label ?? ''}
              onChange={(ev) => setEdges(edges.map((ee, idx) => (idx === i ? { ...ee, label: ev.target.value } : ee)))}
              placeholder="标签"
              className="h-7 flex-1 text-[10px]"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEdges(edges.filter((_, idx) => idx !== i))}
              className="h-7 w-6 p-0 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
