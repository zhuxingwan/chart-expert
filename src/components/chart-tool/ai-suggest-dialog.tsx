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
import { Loader2, Sparkles, Lightbulb } from 'lucide-react'
import type { ChartEngine } from '@/types/chart'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'

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
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [suggestion, setSuggestion] = React.useState<AISuggestion | null>(null)

  const handleSuggest = async () => {
    if (!prompt.trim()) {
      toast.error(t('aiDialog.enterPrompt'))
      return
    }
    setLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, engine }),
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
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setSuggestion(null)
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
