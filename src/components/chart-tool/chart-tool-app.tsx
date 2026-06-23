'use client'

import { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { SaveDialog } from './save-dialog'
import { SavedChartsDialog } from './saved-charts-dialog'
import { AISuggestDialog } from './ai-suggest-dialog'
import type { ChartEngine, EChartsConfig, MermaidConfig, InfographicConfig } from '@/types/chart'
import { toast } from 'sonner'

// Editors are loaded dynamically because they pull in large vendor libraries
const EChartsEditor = dynamic(
  () => import('@/components/echarts-editor/echarts-editor').then(m => m.EChartsEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
)
const MermaidEditor = dynamic(
  () => import('@/components/mermaid-editor/mermaid-editor').then(m => m.MermaidEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
)
const InfographicEditor = dynamic(
  () => import('@/components/infographic-editor/infographic-editor').then(m => m.InfographicEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
)

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-muted-foreground text-sm">正在加载编辑器…</div>
    </div>
  )
}

export function ChartToolApp() {
  const [engine, setEngine] = useState<ChartEngine>('echarts')
  const previewRef = useRef<HTMLDivElement>(null)

  const [echartsConfig, setEchartsConfig] = useState<EChartsConfig | null>(null)
  const [mermaidConfig, setMermaidConfig] = useState<MermaidConfig | null>(null)
  const [infographicConfig, setInfographicConfig] = useState<InfographicConfig | null>(null)

  // Dialogs
  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const handleApplySuggestion = useCallback(
    (suggestedEngine: ChartEngine, config: unknown) => {
      if (suggestedEngine === 'echarts') setEchartsConfig(config as EChartsConfig)
      else if (suggestedEngine === 'mermaid') setMermaidConfig(config as MermaidConfig)
      else setInfographicConfig(config as InfographicConfig)
      setEngine(suggestedEngine)
      toast.success('已应用 AI 推荐')
    },
    []
  )

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader
        engine={engine}
        onEngineChange={setEngine}
        onSave={() => setSaveOpen(true)}
        onLoad={() => setLoadOpen(true)}
        onAISuggest={() => setAiOpen(true)}
      />

      <main className="flex-1 w-full">
        <div className="mx-auto h-full w-full max-w-[1600px] p-3 sm:p-4">
          <div className="h-[calc(100vh-150px)] min-h-[520px] w-full rounded-xl border bg-background shadow-sm overflow-hidden">
            {engine === 'echarts' && (
              <EChartsEditor
                config={echartsConfig}
                onChange={setEchartsConfig}
                previewRef={previewRef}
              />
            )}
            {engine === 'mermaid' && (
              <MermaidEditor
                config={mermaidConfig}
                onChange={setMermaidConfig}
                previewRef={previewRef}
              />
            )}
            {engine === 'infographic' && (
              <InfographicEditor
                config={infographicConfig}
                onChange={setInfographicConfig}
                previewRef={previewRef}
              />
            )}
          </div>
        </div>
      </main>

      <AppFooter />

      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        engine={engine}
        getConfig={() => {
          if (engine === 'echarts') return echartsConfig
          if (engine === 'mermaid') return mermaidConfig
          return infographicConfig
        }}
        previewRef={previewRef}
      />
      <SavedChartsDialog
        open={loadOpen}
        onOpenChange={setLoadOpen}
        onLoad={(loaded) => {
          if (loaded.engine === 'echarts') setEchartsConfig(loaded.config as EChartsConfig)
          else if (loaded.engine === 'mermaid') setMermaidConfig(loaded.config as MermaidConfig)
          else setInfographicConfig(loaded.config as InfographicConfig)
          setEngine(loaded.engine)
          toast.success(`已载入：${loaded.title}`)
        }}
      />
      <AISuggestDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        engine={engine}
        onApply={handleApplySuggestion}
      />
    </div>
  )
}
