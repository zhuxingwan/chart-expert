'use client'

import { useState } from 'react'
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
import type { ChartEngine, AISuggestion } from '@/types/chart'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  engine: ChartEngine
  onApply: (engine: ChartEngine, config: unknown) => void
}

const PLACEHOLDERS: Record<ChartEngine, string> = {
  echarts:
    '例如：展示 2024 年四个季度各产品线的销售额对比，产品线包括手机、电脑、平板。',
  mermaid:
    '例如：画一个用户下单的流程图，从加入购物车到支付成功，包括库存检查与支付校验。',
  'antv-g6':
    '例如：展示公司组织架构图，CEO 下设 CTO、CFO、COO，各自带领若干团队。',
}

const PROMPT_TIPS: Record<ChartEngine, string[]> = {
  echarts: [
    '想看趋势 → 折线图',
    '想看对比 → 柱状图',
    '想看占比 → 饼图',
    '想看分布 → 散点图',
  ],
  mermaid: [
    '业务流程 → 流程图',
    '步骤顺序 → 时序图',
    '思维发散 → 思维导图',
    '项目排期 → 甘特图',
  ],
  'antv-g6': [
    '组织层级 → 树形图',
    '人物关系 → 力导向',
    '数据流向 → 拓扑图',
    '概念分类 → 紧凑树',
  ],
}

export function AISuggestDialog({ open, onOpenChange, engine, onApply }: Props) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)

  const handleSuggest = async () => {
    if (!prompt.trim()) {
      toast.error('请先描述你想要的图表')
      return
    }
    setLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, prompt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '请求失败')
      }
      const data = await res.json()
      setSuggestion(data.result as AISuggestion)
      toast.success('AI 已生成推荐')
    } catch (e) {
      toast.error('AI 推荐失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!suggestion) return
    onApply(engine, suggestion.config)
    onOpenChange(false)
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
            <Sparkles className="h-5 w-5 text-primary" />
            AI 智能推荐
          </DialogTitle>
          <DialogDescription>
            用一句话描述你想呈现的内容，AI 帮你挑选合适的图表类型并生成示例数据。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>描述你的需求</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PLACEHOLDERS[engine]}
              rows={3}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_TIPS[engine].map((tip) => (
                <span
                  key={tip}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSuggest}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            生成推荐
          </Button>

          {suggestion && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1 space-y-1.5">
                  <div className="text-sm">
                    <span className="text-muted-foreground">推荐图表：</span>
                    <span className="font-medium">{suggestion.recommendedTypeName}</span>
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      {suggestion.recommendedType}
                    </span>
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
            取消
          </Button>
          <Button onClick={handleApply} disabled={!suggestion}>
            应用到编辑器
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
