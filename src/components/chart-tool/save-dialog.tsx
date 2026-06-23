'use client'

import { useState, useEffect, type RefObject } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { saveChart } from '@/lib/chart/storage'
import { generateThumbnail } from '@/lib/chart/export'
import type { ChartEngine } from '@/types/chart'
import { toast } from 'sonner'
import { useT, useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  engine: ChartEngine
  getConfig: () => unknown
  previewRef: RefObject<HTMLDivElement | null>
}

export function SaveDialog({
  open,
  onOpenChange,
  engine,
  getConfig,
  previewRef,
}: Props) {
  const t = useT()
  const { locale } = useI18n()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const defaultName =
        engine === 'echarts' ? 'My Chart' : engine === 'mermaid' ? 'My Flowchart' : 'My Infographic'
      const stamp = new Date().toLocaleString(locale, { hour12: false })
      setTitle(`${defaultName} ${stamp}`)
    }
  }, [open, engine, locale])

  const handleSave = async () => {
    const config = getConfig()
    if (!config) {
      toast.error(t('saveDialog.nothingToSave'))
      return
    }
    setSaving(true)
    try {
      const type = (config as { type?: string }).type ?? 'unknown'
      let thumbnail: string | undefined
      if (previewRef.current) {
        thumbnail = await generateThumbnail(previewRef.current)
      }
      await saveChart({ title: title || 'Untitled Chart', engine, type, config, thumbnail })
      toast.success(t('saveDialog.saved'))
      onOpenChange(false)
    } catch (e) {
      toast.error(t('saveDialog.saveFailed', { error: (e as Error).message }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('saveDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('saveDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">{t('saveDialog.chartName')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('saveDialog.placeholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
