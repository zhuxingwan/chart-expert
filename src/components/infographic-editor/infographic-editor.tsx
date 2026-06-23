'use client'

import * as React from 'react'
import { Infographic as InfographicEngine } from '@antv/infographic'
import { toast } from 'sonner'
import {
  Download,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
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
  FileText,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { useT, useI18n } from '@/lib/i18n'
import { useProFeature } from '@/lib/license/use-pro-feature'
import { drawWatermark } from '@/lib/license/watermark'
import {
  getInfographicTemplateName,
  getInfographicCategoryLabel,
} from '@/lib/i18n/template-names'

// ─── Color palette presets (aesthetically curated) ──────────────────────
const COLOR_PRESETS: { name: string; color: string; bg?: string }[] = [
  { name: 'AntV Blue', color: '#1783FF' },
  { name: 'Coral', color: '#FF6B6B' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Amber', color: '#F59E0B' },
  { name: 'Violet', color: '#8B5CF6' },
  { name: 'Rose', color: '#F43F5E' },
  { name: 'Cyan', color: '#06B6D4' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Magenta', color: '#D946EF' },
  { name: 'Lime', color: '#84CC16' },
]

// Random aesthetically pleasing colors (curated, not fully random)
const RANDOM_COLORS = [
  '#1783FF', '#FF6B6B', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E',
  '#06B6D4', '#6366F1', '#14B8A6', '#F97316', '#D946EF', '#84CC16',
  '#EC4899', '#3B82F6', '#22C55E', '#A855F7', '#EF4444', '#0EA5E9',
]

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
// Infographic syntax generator — produces a text-based representation of the
// current config so users can copy it as a ```infographic``` markdown block.
// The format loosely mirrors @antv/infographic's declarative text syntax.
// ---------------------------------------------------------------------------
function generateInfographicSyntax(config: InfographicConfig): string {
  const lines: string[] = []
  lines.push(`infographic ${config.template}`)
  lines.push('data')
  if (config.data.title?.text) {
    lines.push('  title')
    lines.push(`    text ${config.data.title.text}`)
    if (config.data.title.subtext) {
      lines.push(`    subtext ${config.data.title.subtext}`)
    }
  }
  if (config.data.lists && config.data.lists.length > 0) {
    lines.push('  lists')
    for (const item of config.data.lists) {
      const parts = [`- label ${item.label || ''}`]
      if (item.desc) parts.push(`  desc ${item.desc}`)
      if (item.value !== undefined) parts.push(`  value ${item.value}`)
      if (item.icon) parts.push(`  icon ${item.icon}`)
      lines.push(parts.join('\n'))
    }
  }
  if (config.data.nodes && config.data.nodes.length > 0) {
    lines.push('  nodes')
    for (const node of config.data.nodes) {
      lines.push(`    - id ${node.id}`)
      lines.push(`      label ${node.label}`)
      if (node.group) lines.push(`      group ${node.group}`)
    }
  }
  if (config.data.edges && config.data.edges.length > 0) {
    lines.push('  edges')
    for (const edge of config.data.edges) {
      lines.push(`    - from ${edge.from}`)
      lines.push(`      to ${edge.to}`)
      if (edge.label) lines.push(`      label ${edge.label}`)
    }
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InfographicEditorProps {
  config: InfographicConfig | null
  onChange: (cfg: InfographicConfig) => void
  onTemplateChange?: (templateId: string) => void
  previewRef: React.RefObject<HTMLDivElement | null>
}

// ===========================================================================
// Main component
// ===========================================================================

export function InfographicEditor({ config, onChange, onTemplateChange, previewRef }: InfographicEditorProps) {
  const t = useT()
  const { locale } = useI18n()
  const isMobile = useIsMobile()
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
    const timer = setTimeout(() => {
      const key = JSON.stringify(local)
      if (key !== lastAppliedKey.current) {
        lastAppliedKey.current = key
        onChange(deepClone(local))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [local, onChange])

  const update = React.useCallback((patch: Partial<InfographicConfig>) => {
    setLocal((prev) => ({ ...prev, ...patch }))
  }, [])

  const currentTemplate = React.useMemo(
    () => TEMPLATE_REGISTRY.find((t) => t.id === local.template) ?? TEMPLATE_REGISTRY[0],
    [local.template],
  )

  const applyTemplate = React.useCallback((tpl: TemplateMeta) => {
    setLocal((prev) => {
      const prevShape = currentTemplate?.dataShape
      const newShape = tpl.dataShape

      // Try to preserve user data across template switches.
      // Same shape → always keep data.
      // Different shape → try to adapt:
      //   - list/sequence/chart are all flat-list based → compatible
      //   - hierarchy has tree structure → extract labels into flat list when going to flat shapes
      //   - compare has groups → extract all children into flat list when going to flat shapes
      //   - relation has nodes/edges → extract node labels into flat list when going to flat shapes
      //   - flat → hierarchy: put all items under a single root
      //   - flat → compare: split items into 2 groups
      //   - flat → relation: create linear chain from items
      let data = prev.data

      if (prevShape !== newShape) {
        const flatShapes = ['list', 'sequence', 'chart']
        const isFlatToFlat = flatShapes.includes(prevShape ?? '') && flatShapes.includes(newShape)

        if (!isFlatToFlat) {
          // Need to adapt data structure
          const prevData = prev.data
          const adapted: { title?: { text?: string; subtext?: string }; lists?: any[]; nodes?: any[]; edges?: any[] } = {
            title: prevData.title,
          }

          // Extract flat items from any shape
          let flatItems: any[] = []
          if (prevData.lists) {
            flatItems = prevData.lists.map((item: any) => ({
              label: item.label,
              desc: item.desc,
              value: item.value,
              icon: item.icon,
            }))
          } else if (prevData.nodes) {
            flatItems = prevData.nodes.map((node: any) => ({
              label: node.label,
              desc: node.group,
              icon: undefined,
            }))
          }

          if (newShape === 'hierarchy') {
            // Flat → hierarchy: single root with all items as children
            adapted.lists = [{
              label: flatItems[0]?.label || 'Root',
              desc: flatItems[0]?.desc,
              children: flatItems.slice(1).map(item => ({
                label: item.label,
                desc: item.desc,
              })),
            }]
          } else if (newShape === 'compare') {
            // Flat → compare: split into 2 groups
            const mid = Math.ceil(flatItems.length / 2)
            adapted.lists = [
              { label: 'Group A', children: flatItems.slice(0, mid).map(i => ({ label: i.label, desc: i.desc })) },
              { label: 'Group B', children: flatItems.slice(mid).map(i => ({ label: i.label, desc: i.desc })) },
            ]
          } else if (newShape === 'relation') {
            // Flat → relation: create linear chain
            adapted.nodes = flatItems.map((item, i) => ({
              id: `n${i + 1}`,
              label: item.label || `Node ${i + 1}`,
              group: i === 0 ? 'A' : 'B',
            }))
            adapted.edges = flatItems.slice(1).map((item, i) => ({
              from: `n${i + 1}`,
              to: `n${i + 2}`,
            }))
          } else if (flatShapes.includes(newShape)) {
            // hierarchy/compare/relation → flat: use extracted items
            adapted.lists = flatItems
          }

          data = adapted as any
        }
      }

      return {
        ...prev,
        type: tpl.id,
        template: tpl.id,
        data,
      }
    })
    onTemplateChange?.('infographic:' + tpl.id)
    toast.success(
      t('infographic.applied', {
        name: getInfographicTemplateName(locale, tpl.id, tpl.name),
      }),
    )
  }, [t, onTemplateChange, locale, currentTemplate])

  // Three panel contents are already factored into separate components —
  // render them in EITHER a mobile vertical tab layout OR a desktop
  // horizontal resizable-panel layout. Only one layout is in the DOM at a
  // time (driven by `useIsMobile`), so the preview ref always points at the
  // actually-visible element.
  if (isMobile) {
    // Mobile: vertical tab layout — Template | Preview | Config
    return (
      <Tabs defaultValue="preview" className="flex h-full w-full flex-col gap-0">
        <TabsList className="grid h-10 w-full shrink-0 grid-cols-3 rounded-none border-b">
          <TabsTrigger value="templates" className="text-xs">
            {t('infographic.templateGallery')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            Preview
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs">
            {t('infographic.configPanel')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="min-h-0 flex-1 overflow-hidden">
          <TemplateGallery
            currentId={local.template}
            onPick={applyTemplate}
          />
        </TabsContent>
        <TabsContent value="preview" className="min-h-0 flex-1 overflow-hidden">
          <PreviewPanel
            config={local}
            previewRef={previewRef}
          />
        </TabsContent>
        <TabsContent value="config" className="min-h-0 flex-1 overflow-hidden">
          <ConfigPanel
            config={local}
            template={currentTemplate}
            update={update}
          />
        </TabsContent>
      </Tabs>
    )
  }

  // Desktop: horizontal resizable panels
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
  const t = useT()
  const { locale } = useI18n()
  const [keyword, setKeyword] = React.useState('')
  const groups = React.useMemo(() => groupTemplatesByCategory(), [])

  const filtered = React.useMemo(() => {
    if (!keyword.trim()) return null
    const kw = keyword.toLowerCase()
    return TEMPLATE_REGISTRY.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(kw) ||
        getInfographicTemplateName(locale, tpl.id, tpl.name).toLowerCase().includes(kw) ||
        tpl.id.toLowerCase().includes(kw) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(kw)),
    )
  }, [keyword, t, locale])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('infographic.templateGallery')}</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('actions.search')}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {filtered ? (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  active={tpl.id === currentId}
                  onClick={() => onPick(tpl)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                  {t('templatePicker.noResults')}
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
                        {getInfographicCategoryLabel(locale, cat, CATEGORY_LABEL[cat])}
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {list.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {list.map((tpl) => (
                        <TemplateCard
                          key={tpl.id}
                          tpl={tpl}
                          active={tpl.id === currentId}
                          onClick={() => onPick(tpl)}
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
  const t = useT()
  const { locale } = useI18n()
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
      <div className="text-xs font-medium leading-tight">
        {getInfographicTemplateName(locale, tpl.id, tpl.name)}
      </div>
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
  const t = useT()
  const { locale } = useI18n()
  const { isPro, requirePro } = useProFeature()
  const containerRef = React.useRef<HTMLDivElement>(null)
  // The @antv/infographic engine instance.
  const engineRef = React.useRef<any>(null)
  const [zoom, setZoom] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const [fullscreen, setFullscreen] = React.useState(false)
  const renderSeq = React.useRef(0)

  // Listen for Escape key to exit fullscreen
  React.useEffect(() => {
    if (!fullscreen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [fullscreen])

  // Create / destroy engine — @antv/infographic is bundled directly (not CDN).
  // Re-runs on `fullscreen` toggle so the engine rebinds to the new container
  // that mounts inside the fullscreen overlay.
  React.useEffect(() => {
    if (!containerRef.current) return
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
  }, [fullscreen])

  // Render on config change (debounced 250ms)
  React.useEffect(() => {
    const seq = ++renderSeq.current
    const timer = setTimeout(() => {
      if (!engineRef.current || renderSeq.current !== seq) return
      try {
        // Transform data for the engine: our config stores title as {text, subtext}
        // but the @antv/infographic engine expects title as a string and desc as a string.
        const engineData = { ...config.data }
        if (config.data.title && typeof config.data.title === 'object') {
          const t = config.data.title as { text?: string; subtext?: string }
          engineData.title = t.text || ''
          if (t.subtext) engineData.desc = t.subtext
        }
        engineRef.current.render({
          template: config.template,
          data: engineData,
          theme: config.theme,
          themeConfig: {
            ...(config.colorPrimary ? { colorPrimary: config.colorPrimary } : {}),
            ...(config.colorPrimary ? { colorBg: config.background } : {}),
          },
        })
        setError(null)
      } catch (e) {
        console.error('Infographic render error', e)
        setError((e as Error).message)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [config.template, config.data, config.theme, fullscreen])

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2))
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2))
  const handleReset = () => setZoom(1)

  const handleDownloadSvg = async () => {
    if (!requirePro()) return
    if (!engineRef.current) {
      toast.error(t('toasts.noContent'))
      return
    }
    try {
      // Use the engine's built-in toDataURL which handles resource embedding
      const dataUrl = await engineRef.current.toDataURL({ type: 'svg' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `infographic-${Date.now()}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(t('toasts.exported'))
    } catch (e) {
      toast.error(t('toasts.exportFailed', { error: (e as Error).message }))
    }
  }

  const handleDownloadPng = async () => {
    if (!engineRef.current) {
      toast.error(t('toasts.noContent'))
      return
    }
    try {
      // Use the engine's built-in toDataURL — it handles resource embedding
      // internally, avoiding the "tainted canvas" SecurityError that occurs
      // when manually drawing an SVG (containing external CDN fonts/images)
      // onto a canvas via drawImage().
      const dataUrl = await engineRef.current.toDataURL({ type: 'png', dpr: 2 })

      if (isPro) {
        // Pro user: download without watermark
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `infographic-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success(t('toasts.exported'))
      } else {
        // Free user: add NoteRich watermark before download
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
            a.download = `infographic-${Date.now()}.png`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
          }, 'image/png')
          toast.success(t('toasts.exported'))
        }
        img.onerror = () => toast.error(t('toasts.exportFailed', { error: 'PNG' }))
        img.src = dataUrl
      }
    } catch (e) {
      toast.error(t('toasts.exportFailed', { error: (e as Error).message }))
    }
  }

  const handleCopyAsMarkdown = () => {
    if (!requirePro()) return
    // For infographic, generate the infographic syntax from the current config
    // and wrap it in a markdown ```infographic``` code fence.
    const syntax = generateInfographicSyntax(config)
    const markdown = '```infographic\n' + syntax + '\n```'
    navigator.clipboard.writeText(markdown).then(() => {
      toast.success(t('toasts.markdownCopied'))
    }).catch(() => {
      toast.error(t('toasts.copyFailed'))
    })
  }

  const toolbar = (
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
        <Button size="sm" variant="ghost" onClick={handleCopyAsMarkdown} className="h-7 gap-1 px-2 text-xs">
          <FileText className="h-3 w-3" /> Markdown
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setFullscreen((f) => !f)}
          className="h-7 gap-1 px-2 text-xs"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          {fullscreen ? 'Exit' : 'Fullscreen'}
        </Button>
      </div>
    </div>
  )

  const canvas = (
    <div
      ref={previewRef}
      className="relative min-h-0 flex-1 overflow-auto p-4"
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
      {error && (
        <div className="absolute inset-x-4 bottom-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="mb-1 font-semibold">{t('infographic.renderError')}</div>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap">{error}</pre>
        </div>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {toolbar}
        {canvas}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {toolbar}
      {canvas}
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
  const t = useT()
  const { locale } = useI18n()
  return (
    <div className="flex h-full flex-col">
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-4">
        {/* Template info */}
        <section className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {getInfographicCategoryLabel(locale, template.category, CATEGORY_LABEL[template.category])}
            </Badge>
            <h3 className="text-sm font-semibold">
              {getInfographicTemplateName(locale, template.id, template.name)}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </section>

        {/* Title */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">{t('infographic.title_section')}</h4>
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
              placeholder={t('infographic.mainTitle')}
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
              placeholder={t('infographic.subtitle')}
              className="h-8 text-xs"
            />
          </div>
        </section>

        {/* Data editor — switch by data shape */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">{t('infographic.data')}</h4>
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
          <h4 className="text-xs font-semibold text-muted-foreground">{t('infographic.style')}</h4>
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
                  {th === 'light' ? t('infographic.themeLight') : th === 'dark' ? t('infographic.themeDark') : t('infographic.themeHandDrawn')}
                </button>
              ))}
            </div>

            {/* Color palette presets */}
            <div>
              <Label className="mb-1 block text-[10px] text-muted-foreground">
                {locale.startsWith('zh') ? '主色预设' : 'Color Preset'}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => update({ colorPrimary: preset.color, background: preset.bg ?? config.background })}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-all',
                      config.colorPrimary === preset.color
                        ? 'border-foreground ring-1 ring-foreground ring-offset-1'
                        : 'border-muted hover:border-foreground/40',
                    )}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
                {/* Random palette button */}
                <button
                  onClick={() => {
                    const random = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
                    update({ colorPrimary: random, background: config.theme === 'dark' ? '#1F1F1F' : '#ffffff' })
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-muted text-xs hover:border-foreground/40"
                  title={locale.startsWith('zh') ? '随机颜色' : 'Random'}
                >
                  🎲
                </button>
                {/* Reset color */}
                {config.colorPrimary && (
                  <button
                    onClick={() => update({ colorPrimary: undefined })}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-muted text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
                    title={locale.startsWith('zh') ? '清除' : 'Clear'}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="w-16 text-xs">{t('infographic.background')}</Label>
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
    </div>
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
  const t = useT()
  const { locale } = useI18n()
  const items = config.data.lists ?? []

  const setItems = (next: InfographicItem[]) => {
    update({ data: { ...config.data, lists: next } })
  }

  const add = () => {
    setItems([
      ...items,
      { label: `Item ${items.length + 1}`, desc: '', value: 50, icon: 'pin' },
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
              placeholder={t('infographic.iconPlaceholder')}
              className="h-7 w-12 text-center text-xs"
            />
            <Input
              value={it.label ?? ''}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              placeholder={t('infographic.labelPlaceholder')}
              className="h-7 flex-1 text-xs"
            />
            <Button size="sm" variant="ghost" onClick={() => move(i, -1)} className="h-7 w-6 p-0" disabled={i === 0} aria-label={t('infographic.moveUp')}>
              ↑
            </Button>
            <Button size="sm" variant="ghost" onClick={() => move(i, 1)} className="h-7 w-6 p-0" disabled={i === items.length - 1} aria-label={t('infographic.moveDown')}>
              ↓
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(i)} className="h-7 w-6 p-0 text-destructive" aria-label={t('actions.delete')}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={it.desc ?? ''}
            onChange={(e) => updateItem(i, { desc: e.target.value })}
            placeholder={t('infographic.descPlaceholder')}
            className="h-7 text-xs"
          />
          {(it.value !== undefined) && (
            <div className="flex items-center gap-1.5">
              <Label className="w-10 text-[10px] text-muted-foreground">{t('infographic.valueLabel')}</Label>
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
        <Plus className="h-3 w-3" /> {t('infographic.addNode')}
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
  const t = useT()
  const { locale } = useI18n()
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
        onClick={() => setRoot({ label: 'Root', children: [] })}
      >
        {t('infographic.initTree')}
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
  const t = useT()
  const { locale } = useI18n()
  const [expanded, setExpanded] = React.useState(depth < 2)

  const patch = (p: Partial<InfographicItem>) => onChange({ ...node, ...p })

  const addChild = () => {
    const children = [...(node.children ?? []), { label: `Node ${(node.children?.length ?? 0) + 1}` }]
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
          placeholder={t('infographic.labelPlaceholder')}
          className="h-7 flex-1 text-xs"
          style={{ fontWeight: depth === 0 ? 600 : 400 }}
        />
        {depth > 0 && (
          <Button size="sm" variant="ghost" onClick={() => onChange({})} className="h-7 w-6 p-0 text-destructive" aria-label={t('actions.delete')}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {depth === 0 && (
        <Input
          value={node.desc ?? ''}
          onChange={(e) => patch({ desc: e.target.value })}
          placeholder={t('infographic.descPlaceholder')}
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
        <Plus className="h-2.5 w-2.5" /> {t('infographic.addChild')}
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
  const t = useT()
  const { locale } = useI18n()
  const groups = config.data.lists ?? []

  const setGroups = (next: InfographicItem[]) => {
    update({ data: { ...config.data, lists: next } })
  }

  const addGroup = () => {
    setGroups([...groups, { label: `Group ${groups.length + 1}`, children: [] }])
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
              placeholder="Group name"
              className="h-7 flex-1 text-xs font-medium"
            />
            <Button size="sm" variant="ghost" onClick={() => removeGroup(i)} className="h-7 w-6 p-0 text-destructive" aria-label={t('actions.delete')}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={g.desc ?? ''}
            onChange={(e) => updateGroup(i, { ...g, desc: e.target.value })}
            placeholder={t('infographic.descPlaceholder')}
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
                  placeholder="Point"
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
                  aria-label={t('actions.delete')}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const children = [...(g.children ?? []), { label: 'New point' }]
                updateGroup(i, { ...g, children })
              }}
              className="h-5 gap-1 text-[10px] text-muted-foreground"
            >
              <Plus className="h-2.5 w-2.5" /> {t('infographic.addChild')}
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addGroup} className="w-full gap-1 text-xs">
        <Plus className="h-3 w-3" /> {t('infographic.addGroup')}
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
  const t = useT()
  const { locale } = useI18n()
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
          <span className="text-[11px] font-medium text-muted-foreground">{t('infographic.nodes', { count: nodes.length })}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setNodes([
                ...nodes,
                { id: `n${nodes.length + 1}`, label: `Node ${nodes.length + 1}` },
              ])
            }
            className="h-6 gap-1 px-1.5 text-[10px]"
          >
            <Plus className="h-2.5 w-2.5" /> {t('infographic.addNode')}
          </Button>
        </div>
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={n.id}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, id: e.target.value } : nn)))}
              placeholder={t('infographic.nodeId')}
              className="h-7 w-16 font-mono text-[10px]"
            />
            <Input
              value={n.label}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, label: e.target.value } : nn)))}
              placeholder={t('infographic.nodeName')}
              className="h-7 flex-1 text-xs"
            />
            <Input
              value={n.group ?? ''}
              onChange={(e) => setNodes(nodes.map((nn, idx) => (idx === i ? { ...nn, group: e.target.value } : nn)))}
              placeholder={t('infographic.nodeGroup')}
              className="h-7 w-12 text-[10px]"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNodes(nodes.filter((_, idx) => idx !== i))}
              className="h-7 w-6 p-0 text-destructive"
              aria-label={t('actions.delete')}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Edges */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">{t('infographic.edges', { count: edges.length })}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEdges([...edges, { from: nodes[0]?.id ?? '', to: nodes[1]?.id ?? '' }])}
            className="h-6 gap-1 px-1.5 text-[10px]"
          >
            <Plus className="h-2.5 w-2.5" /> {t('infographic.addEdge')}
          </Button>
        </div>
        {edges.map((e, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Select
              value={e.from}
              onValueChange={(v) => setEdges(edges.map((ee, idx) => (idx === i ? { ...ee, from: v } : ee)))}
            >
              <SelectTrigger className="h-7 w-16 text-[10px]">
                <SelectValue placeholder={t('infographic.edgeFrom')} />
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
                <SelectValue placeholder={t('infographic.edgeTo')} />
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
              placeholder={t('infographic.edgeLabel')}
              className="h-7 flex-1 text-[10px]"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEdges(edges.filter((_, idx) => idx !== i))}
              className="h-7 w-6 p-0 text-destructive"
              aria-label={t('actions.delete')}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
