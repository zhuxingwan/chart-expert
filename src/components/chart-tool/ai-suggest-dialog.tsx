'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Lightbulb, Upload, X, ImageIcon } from 'lucide-react'
import type { ChartEngine } from '@/types/chart'
import { toast } from 'sonner'
import { useT, useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Optional engine hint — if undefined, AI picks the library automatically. */
  engine?: ChartEngine
  onApply: (engine: ChartEngine, config: unknown) => void
}

interface AISuggestion {
  engine: ChartEngine
  recommendedTypeName: string
  reason: string
  config: unknown
}

const PROMPT_IDEAS = [
  'Compare 2024 quarterly sales across product lines',
  'Draw a user checkout flowchart from add-to-cart to payment success',
  'Make a product launch roadmap covering design, dev, test, release',
  'Compare the pros and cons of React and Vue',
  'Show the company org chart with CEO over CTO/CFO/COO',
  'Show weekly visit intensity across different times of day',
  'Draw a purchase conversion funnel',
  'Show project milestones timeline from kickoff to launch',
]

export function AISuggestDialog({ open, onOpenChange, engine, onApply }: Props) {
  const t = useT()
  const { locale } = useI18n()
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [suggestion, setSuggestion] = React.useState<AISuggestion | null>(null)
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSuggest = async () => {
    if (!prompt.trim() && !imageDataUrl) {
      toast.error(t('aiDialog.enterPrompt'))
      return
    }
    setLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, engine, locale, imageDataUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Request failed')
      }
      const data = await res.json()
      setSuggestion(data.result as AISuggestion)
      toast.success(t('aiDialog.generate'))
    } catch (e) {
      toast.error(t('aiDialog.failed', { error: (e as Error).message }))
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!suggestion) return
    onApply(suggestion.engine, suggestion.config)
    setPrompt('')
    setSuggestion(null)
    setImageDataUrl(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(reader.result as string)
    }
    reader.onerror = () => toast.error('Failed to read image')
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setSuggestion(null)
          setImageDataUrl(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {t('aiDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Prompt input */}
          <div className="grid gap-2">
            <Label>{t('aiDialog.promptLabel')}</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('aiDialog.promptPlaceholder')}
              rows={3}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  {idea.length > 32 ? idea.slice(0, 32) + '…' : idea}
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {locale.startsWith('zh') ? '参考图片（可选）' :
               locale.startsWith('ja') ? '参照画像（任意）' :
               locale.startsWith('ko') ? '참조 이미지 (선택)' :
               locale.startsWith('es') ? 'Imagen de referencia (opcional)' :
               locale.startsWith('fr') ? 'Image de référence (optionnel)' :
               locale.startsWith('de') ? 'Referenzbild (optional)' :
               'Reference image (optional)'}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imageDataUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageDataUrl}
                  alt="Reference"
                  className="max-h-32 rounded-lg border object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {locale.startsWith('zh') ? '上传图片（图表截图、草图、数据表等）' :
                   locale.startsWith('ja') ? '画像をアップロード' :
                   locale.startsWith('ko') ? '이미지 업로드' :
                   locale.startsWith('es') ? 'Subir imagen' :
                   locale.startsWith('fr') ? 'Téléverser une image' :
                   locale.startsWith('de') ? 'Bild hochladen' :
                   'Upload image (chart screenshot, sketch, data table, etc.)'}
                </span>
              </button>
            )}
          </div>

          <Button onClick={handleSuggest} disabled={loading} className="gap-1.5">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t('aiDialog.generate')}
          </Button>

          {suggestion && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1 space-y-1.5">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('aiDialog.recommended')}</span>
                    <span className="font-medium">{suggestion.recommendedTypeName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 text-[10px] leading-relaxed">
{JSON.stringify(suggestion.config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={!suggestion}>
            {t('actions.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
