'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Trash2, Search, Inbox } from 'lucide-react'
import { listCharts, deleteChart } from '@/lib/chart/storage'
import { cn } from '@/lib/utils'
import type { SavedChart, ChartEngine } from '@/types/chart'
import { toast } from 'sonner'
import { useT, useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onLoad: (chart: SavedChart) => void
}

const ENGINE_LABEL: Record<ChartEngine, string> = {
  echarts: 'ECharts',
  mermaid: 'Mermaid',
  infographic: 'Infographic',
}
const ENGINE_COLOR: Record<ChartEngine, string> = {
  echarts: 'bg-emerald-100 text-emerald-700',
  mermaid: 'bg-amber-100 text-amber-700',
  infographic: 'bg-rose-100 text-rose-700',
}

export function SavedChartsDialog({ open, onOpenChange, onLoad }: Props) {
  const t = useT()
  const { locale } = useI18n()
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      setCharts(await listCharts())
    } catch (e) {
      toast.error(t('loadDialog.loadFailed', { error: (e as Error).message }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) refresh()
  }, [open])

  const filtered = charts.filter(
    (c) =>
      c.title.toLowerCase().includes(keyword.toLowerCase()) ||
      c.type.toLowerCase().includes(keyword.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteChart(id)
      setCharts((prev) => prev.filter((c) => c.id !== id))
      toast.success(t('toasts.deleted'))
    } catch (e) {
      toast.error(t('loadDialog.deleteFailed', { error: (e as Error).message }))
    }
  }

  const handleLoad = (c: SavedChart) => {
    onLoad(c)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('loadDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('loadDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('actions.search')}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[55vh] pr-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('app.loadingEditor')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <span>{t('loadDialog.empty')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
                >
                  <button
                    onClick={() => handleLoad(c)}
                    className="block w-full text-left"
                  >
                    <div className="flex aspect-[4/3] items-center justify-center bg-muted/40 p-2">
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">{t('loadDialog.noPreview')}</div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                            ENGINE_COLOR[c.engine as ChartEngine] ?? 'bg-muted'
                          )}
                        >
                          {ENGINE_LABEL[c.engine as ChartEngine] ?? c.engine}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {c.type}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(c.updatedAt).toLocaleString(locale, { hour12: false })}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(c.id)
                    }}
                    className="absolute right-1.5 top-1.5 hidden rounded-md bg-background/80 p-1 text-muted-foreground hover:text-destructive group-hover:block"
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
