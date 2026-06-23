'use client'

import * as React from 'react'
import { useVizLibs, getMermaid } from '@/lib/viz-libs/cdn-loader'
import { toast } from 'sonner'
import {
  Workflow,
  ArrowRightLeft,
  Network,
  Database,
  CalendarClock,
  Footprints,
  Brain,
  PieChart,
  GitBranch,
  History,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Copy,
  Code2,
  Sparkles,
  Triangle,
  ListOrdered,
  Loader2,
  FileText,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { MermaidConfig } from '@/types/chart'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ScrollArea,
} from '@/components/ui/scroll-area'
import {
  MERMAID_TEMPLATES,
  MERMAID_THEMES,
  SYNTAX_CHEATSHEET,
  type MermaidTemplateMeta,
} from './mermaid-templates'
import { exportSvg } from '@/lib/chart/export'
import { useT } from '@/lib/i18n'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Workflow,
  ArrowRightLeft,
  Network,
  State: Workflow, // state-diagram icon alias
  Database,
  CalendarClock,
  Footprints,
  Brain,
  PieChart,
  GitBranch,
  Timeline: History, // timeline icon alias
  Triangle,
  ListOrdered,
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MermaidEditorProps {
  config: MermaidConfig | null
  onChange: (cfg: MermaidConfig) => void
  onTemplateChange?: (templateId: string) => void
  previewRef: React.RefObject<HTMLDivElement | null>
}

// ===========================================================================
// Component
// ===========================================================================

export function MermaidEditor({ config, onChange, onTemplateChange, previewRef }: MermaidEditorProps) {
  const t = useT()
  const [local, setLocal] = React.useState<MermaidConfig>(() =>
    config
      ? deepClone(config)
      : {
          type: MERMAID_TEMPLATES[0].type,
          code: MERMAID_TEMPLATES[0].defaultCode,
          theme: 'default',
          background: '#ffffff',
        },
  )
  const lastAppliedKey = React.useRef<string>('')

  // Sync parent -> local (only when parent value genuinely changes)
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

  const update = React.useCallback((patch: Partial<MermaidConfig>) => {
    setLocal((prev) => ({ ...prev, ...patch }))
  }, [])

  const applyTemplate = React.useCallback((tpl: MermaidTemplateMeta) => {
    setLocal((prev) => ({
      ...prev,
      type: tpl.type,
      code: tpl.defaultCode,
    }))
    onTemplateChange?.('mermaid:' + tpl.id)
    toast.success(t('toasts.applied', { name: tpl.name }))
  }, [t, onTemplateChange])

  const handleFormat = () => {
    update({
      code: local.code
        .split('\n')
        .map((l) => l.replace(/\s+$/, ''))
        .join('\n'),
    })
    toast.success(t('toasts.formatDone'))
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(local.code)
      toast.success(t('mermaid.codeCopied'))
    } catch {
      toast.error(t('toasts.copyFailed'))
    }
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* ---------------- Left: Configuration ---------------- */}
      <ResizablePanel defaultSize={45} minSize={28} maxSize={60}>
        <div className="flex h-full flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4">
            {/* Template gallery */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('mermaid.templateGallery')}</h3>
                <span className="text-xs text-muted-foreground">
                  {MERMAID_TEMPLATES.length} templates
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MERMAID_TEMPLATES.map((tpl) => {
                  const Icon = ICON_MAP[tpl.icon] ?? Workflow
                  const active = local.type === tpl.type
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-all',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-foreground/30 hover:bg-muted/50',
                      )}
                      title={tpl.description}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          active ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <span className="text-xs font-medium">{tpl.name}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Code editor */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('mermaid.codeEditor')}</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleFormat} className="h-7 gap-1 px-2 text-xs">
                    <Code2 className="h-3 w-3" /> {t('mermaid.format')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCopyCode} className="h-7 gap-1 px-2 text-xs">
                    <Copy className="h-3 w-3" /> {t('mermaid.copyCode')}
                  </Button>
                </div>
              </div>
              <Textarea
                value={local.code}
                onChange={(e) => update({ code: e.target.value })}
                className="max-h-[420px] min-h-[220px] resize-y font-mono text-xs leading-relaxed"
                spellCheck={false}
                placeholder="Type Mermaid code here…"
              />
              <div className="mt-1 flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{t('mermaid.aiHint')}</span>
              </div>
            </section>

            {/* Theme + background */}
            <section className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">{t('mermaid.theme')}</Label>
                <Select
                  value={local.theme}
                  onValueChange={(v) => update({ theme: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MERMAID_THEMES.map((th) => (
                      <SelectItem key={th.id} value={th.id} className="text-xs">
                        {th.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">{t('mermaid.background')}</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="color"
                    value={local.background}
                    onChange={(e) => update({ background: e.target.value })}
                    className="h-8 w-10 cursor-pointer p-1"
                  />
                  <Input
                    value={local.background}
                    onChange={(e) => update({ background: e.target.value })}
                    className="h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </section>

            {/* Cheat sheet */}
            <section>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="cheat" className="border rounded-md px-3">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    {t('mermaid.cheatsheet')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 py-1">
                      {SYNTAX_CHEATSHEET.map((c) => (
                        <div key={c.type}>
                          <div className="mb-1 text-xs font-semibold text-foreground">
                            {c.title}
                          </div>
                          <pre className="overflow-auto rounded bg-muted p-2 text-[10px] leading-relaxed">
{c.lines.join('\n')}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </div>
        </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ---------------- Right: Preview ---------------- */}
      <ResizablePanel defaultSize={55} minSize={35}>
        <PreviewPanel
          config={local}
          previewRef={previewRef}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

// ===========================================================================
// Preview
// ===========================================================================

interface PreviewProps {
  config: MermaidConfig
  previewRef: React.RefObject<HTMLDivElement | null>
}

function PreviewPanel({ config, previewRef }: PreviewProps) {
  const t = useT()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const renderSeq = React.useRef(0)
  const initialized = React.useRef(false)

  // Mermaid is loaded from CDN via <VizLibLoader>. We must wait for the
  // `loaded` status before calling mermaid.initialize / mermaid.render.
  const { status } = useVizLibs()
  const mermaidLoaded = status.mermaid === 'loaded'

  // Initialize mermaid once (or when theme changes) — gated on CDN load.
  React.useEffect(() => {
    if (!mermaidLoaded) return
    const mermaid = getMermaid()
    if (!mermaid) return
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: config.theme as never,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeVariables: {
          background: config.background,
        },
      })
      initialized.current = true
    } catch (e) {
      console.error('mermaid init error', e)
    }
  }, [config.theme, config.background, mermaidLoaded])

  // Render (debounced 300ms) — gated on CDN load.
  React.useEffect(() => {
    if (!mermaidLoaded) return
    const seq = ++renderSeq.current
    const timer = setTimeout(async () => {
      if (!containerRef.current || !initialized.current) return
      const mermaid = getMermaid()
      if (!mermaid) return
      // Clear previous
      containerRef.current.innerHTML = ''
      try {
        const id = `mermaid-${seq}-${Date.now()}`
        const { svg } = await mermaid.render(id, config.code || 'graph TD; A-->B')
        if (renderSeq.current !== seq) return
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          const svgEl = containerRef.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
          }
        }
        setError(null)
      } catch (e) {
        if (renderSeq.current !== seq) return
        setError((e as Error).message || String(e))
        if (containerRef.current) containerRef.current.innerHTML = ''
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [config.code, config.theme, config.background, mermaidLoaded])

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.2))
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, z - 0.2))
  const handleReset = () => setZoom(1)

  const handleDownloadSvg = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) {
      toast.error(t('toasts.noContent'))
      return
    }
    exportSvg(svg, `mermaid-${Date.now()}.svg`)
    toast.success(t('toasts.exported'))
  }

  const handleDownloadPng = async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) {
      toast.error(t('toasts.noContent'))
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
      const serializer = new XMLSerializer()
      const svgStr = serializer.serializeToString(clone)
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
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
          a.download = `mermaid-${Date.now()}.png`
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        }, 'image/png')
        toast.success(t('toasts.exported'))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        toast.error(t('toasts.exportFailed', { error: 'PNG' }))
      }
      img.src = url
    } catch (e) {
      toast.error(t('toasts.exportFailed', { error: (e as Error).message }))
    }
  }

  const handleCopyAsMarkdown = async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) {
      toast.error(t('toasts.noContent'))
      return
    }
    try {
      // For mermaid, the markdown fence wraps the mermaid SOURCE code (not the SVG)
      const markdown = '```mermaid\n' + config.code + '\n```'
      await navigator.clipboard.writeText(markdown)
      toast.success(t('toasts.copied'))
    } catch {
      toast.error(t('toasts.copyFailed'))
    }
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
          <Button size="sm" variant="ghost" onClick={handleCopyAsMarkdown} className="h-7 gap-1 px-2 text-xs">
            <FileText className="h-3 w-3" /> Markdown
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={previewRef}
        className="relative min-h-0 flex-1 overflow-auto bg-muted/30 p-4"
        style={{ background: config.background }}
      >
        <div
          className="mx-auto flex min-h-full w-full items-center justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
        >
          <div
            ref={containerRef}
            className="mermaid-preview max-w-full"
            style={{ background: config.background }}
          />
        </div>
        {!mermaidLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{t('app.loadingLib')}</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <div className="mb-1 font-semibold">{t('mermaid.renderError')}</div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
