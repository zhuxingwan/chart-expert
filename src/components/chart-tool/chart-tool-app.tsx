'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { SaveDialog } from './save-dialog'
import { SavedChartsDialog } from './saved-charts-dialog'
import { AISuggestDialog } from './ai-suggest-dialog'
import { TemplatePickerDialog } from './template-picker-dialog'
import { VizLibLoader } from '@/lib/viz-libs/cdn-loader'
import type {
  ChartEngine,
  EChartsConfig,
  MermaidConfig,
  InfographicConfig,
} from '@/types/chart'
import {
  UNIFIED_TEMPLATES,
  findUnifiedTemplate,
  defaultConfigForEngine,
  type UnifiedTemplate,
} from '@/lib/chart/unified-catalog'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'

// Editors are loaded dynamically — the user never sees which library is used.
const EChartsEditor = dynamic(
  () => import('@/components/echarts-editor/echarts-editor').then(m => m.EChartsEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
)
const MermaidEditor = dynamic(
  () => import('@/components/mermaid-editor/mermaid-editor').then(m => m.MermaidEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
)
const InfographicEditor = dynamic(
  () => import('@/components/infographic-editor/infographic-editor').then(m => m.InfographicEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
)

function EditorSkeleton() {
  const t = useT()
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-muted-foreground text-sm">{t('app.loadingEditor')}</div>
    </div>
  )
}

interface ActiveDoc {
  engine: ChartEngine
  templateId: string // unified id like "echarts:bar"
  echarts?: EChartsConfig
  mermaid?: MermaidConfig
  infographic?: InfographicConfig
}

// ---- URL helpers ----
/** Read the `?chart=` query param. Returns the unified template id or null. */
function getChartFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const chart = params.get('chart')
  return chart
}

/** Update the URL's `?chart=` param without triggering a navigation/reload. */
function updateUrlChart(templateId: string) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('chart', templateId)
  window.history.replaceState(window.history.state, '', url.toString())
}

/** Clear the `?chart=` param (when no doc is active). */
function clearUrlChart() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('chart')
  window.history.replaceState(window.history.state, '', url.toString())
}

/** Activate a doc from a unified template id (e.g. "echarts:bar"). */
function activateFromTemplateId(templateId: string): ActiveDoc | null {
  const tpl = findUnifiedTemplate(templateId)
  if (!tpl) return null
  const config = defaultConfigForEngine(tpl.engine, tpl.libraryType)
  return {
    engine: tpl.engine,
    templateId: tpl.id,
    echarts: tpl.engine === 'echarts' ? (config as EChartsConfig) : undefined,
    mermaid: tpl.engine === 'mermaid' ? (config as MermaidConfig) : undefined,
    infographic: tpl.engine === 'infographic' ? (config as InfographicConfig) : undefined,
  }
}

export function ChartToolApp() {
  const t = useT()
  const previewRef = React.useRef<HTMLDivElement>(null)

  // On first mount, check the URL for a ?chart= param. If present, activate
  // that template directly (no picker dialog). Otherwise start empty.
  const [doc, setDoc] = React.useState<ActiveDoc | null>(() => {
    if (typeof window === 'undefined') return null
    const chartParam = getChartFromUrl()
    if (chartParam) {
      return activateFromTemplateId(chartParam)
    }
    return null
  })

  // Dialogs
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [loadOpen, setLoadOpen] = React.useState(false)
  const [aiOpen, setAiOpen] = React.useState(false)

  // Open the picker automatically on first load if no document is active
  // (and no ?chart= param was in the URL).
  React.useEffect(() => {
    if (!doc && !getChartFromUrl()) {
      setPickerOpen(true)
    }
  }, [doc])

  // Sync URL when doc changes
  React.useEffect(() => {
    if (doc) {
      updateUrlChart(doc.templateId)
    } else {
      clearUrlChart()
    }
  }, [doc])

  // Listen for browser back/forward navigation to update the active doc
  React.useEffect(() => {
    const handlePopState = () => {
      const chartParam = getChartFromUrl()
      if (chartParam) {
        const newDoc = activateFromTemplateId(chartParam)
        if (newDoc) {
          setDoc(newDoc)
          return
        }
      }
      // No chart param — go back to empty state
      setDoc(null)
      setPickerOpen(true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handlePickTemplate = React.useCallback((tpl: UnifiedTemplate) => {
    const config = defaultConfigForEngine(tpl.engine, tpl.libraryType)
    setDoc({
      engine: tpl.engine,
      templateId: tpl.id,
      echarts: tpl.engine === 'echarts' ? (config as EChartsConfig) : undefined,
      mermaid: tpl.engine === 'mermaid' ? (config as MermaidConfig) : undefined,
      infographic: tpl.engine === 'infographic' ? (config as InfographicConfig) : undefined,
    })
    setPickerOpen(false)
    toast.success(t('toasts.applied', { name: tpl.name }))
  }, [t])

  const handleApplySuggestion = React.useCallback(
    (engine: ChartEngine, config: unknown) => {
      // Try to find a unified template matching the engine + library type
      const libType = (config as { type?: string; template?: string }).type
        ?? (config as { template?: string }).template
        ?? ''
      const tpl = findUnifiedTemplate(`${engine}:${libType}`)
      setDoc({
        engine,
        templateId: tpl?.id ?? `${engine}:${libType}`,
        echarts: engine === 'echarts' ? (config as EChartsConfig) : undefined,
        mermaid: engine === 'mermaid' ? (config as MermaidConfig) : undefined,
        infographic: engine === 'infographic' ? (config as InfographicConfig) : undefined,
      })
      setAiOpen(false)
      toast.success(t('toasts.aiApplied'))
    },
    [t],
  )

  const handleLoadSaved = React.useCallback(
    (loaded: {
      engine: ChartEngine
      type: string
      config: unknown
      title: string
    }) => {
      setDoc({
        engine: loaded.engine,
        templateId: `${loaded.engine}:${loaded.type}`,
        echarts: loaded.engine === 'echarts' ? (loaded.config as EChartsConfig) : undefined,
        mermaid: loaded.engine === 'mermaid' ? (loaded.config as MermaidConfig) : undefined,
        infographic: loaded.engine === 'infographic' ? (loaded.config as InfographicConfig) : undefined,
      })
      setLoadOpen(false)
      toast.success(t('toasts.loaded', { title: loaded.title }))
    },
    [t],
  )

  const getConfig = React.useCallback((): unknown => {
    if (!doc) return null
    if (doc.engine === 'echarts') return doc.echarts
    if (doc.engine === 'mermaid') return doc.mermaid
    return doc.infographic
  }, [doc])

  const getCurrentTemplateName = React.useCallback((): string => {
    if (!doc) return ''
    return findUnifiedTemplate(doc.templateId)?.name ?? ''
  }, [doc])

  return (
    <VizLibLoader>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <AppHeader
          templateName={getCurrentTemplateName()}
          onNewChart={() => setPickerOpen(true)}
          onSave={() => {
            if (!doc) {
              toast.error('Please select a template first')
              return
            }
            setSaveOpen(true)
          }}
          onLoad={() => setLoadOpen(true)}
          onAISuggest={() => setAiOpen(true)}
        />

        <main className="flex-1 w-full">
          <div className="mx-auto h-full w-full max-w-[1600px] p-3 sm:p-4">
            <div className="h-[calc(100vh-140px)] min-h-[400px] w-full rounded-xl border bg-background shadow-sm overflow-hidden">
              {!doc ? (
                <EmptyState onPick={() => setPickerOpen(true)} />
              ) : doc.engine === 'echarts' ? (
                <EChartsEditor
                  config={doc.echarts ?? null}
                  onChange={(cfg) => setDoc((d) => (d ? { ...d, echarts: cfg } : d))}
                  onTemplateChange={(tid) => setDoc((d) => (d ? { ...d, templateId: tid } : d))}
                  previewRef={previewRef}
                />
              ) : doc.engine === 'mermaid' ? (
                <MermaidEditor
                  config={doc.mermaid ?? null}
                  onChange={(cfg) => setDoc((d) => (d ? { ...d, mermaid: cfg } : d))}
                  onTemplateChange={(tid) => setDoc((d) => (d ? { ...d, templateId: tid } : d))}
                  previewRef={previewRef}
                />
              ) : (
                <InfographicEditor
                  config={doc.infographic ?? null}
                  onChange={(cfg) => setDoc((d) => (d ? { ...d, infographic: cfg } : d))}
                  onTemplateChange={(tid) => setDoc((d) => (d ? { ...d, templateId: tid } : d))}
                  previewRef={previewRef}
                />
              )}
            </div>
          </div>
        </main>

        <AppFooter />

        <TemplatePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={handlePickTemplate}
        />
        <SaveDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          engine={doc?.engine ?? 'echarts'}
          getConfig={getConfig}
          previewRef={previewRef}
        />
        <SavedChartsDialog
          open={loadOpen}
          onOpenChange={setLoadOpen}
          onLoad={handleLoadSaved}
        />
        <AISuggestDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          engine={doc?.engine}
          onApply={handleApplySuggestion}
        />
      </div>
    </VizLibLoader>
  )
}

function EmptyState({ onPick }: { onPick: () => void }) {
  const t = useT()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 14l4-4 4 4 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold">{t('emptyState.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('emptyState.description')}
        </p>
      </div>
      <button
        onClick={onPick}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t('emptyState.selectTemplate')}
      </button>
    </div>
  )
}
