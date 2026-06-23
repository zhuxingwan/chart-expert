'use client'

import { BarChart3, Sparkles, Save, FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  templateName: string
  onNewChart: () => void
  onSave: () => void
  onLoad: () => void
  onAISuggest: () => void
}

export function AppHeader({
  templateName,
  onNewChart,
  onSave,
  onLoad,
  onAISuggest,
}: Props) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              图表制作工坊
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {templateName ? `当前：${templateName}` : '丰富的图表 / 流程图 / 信息图 · 零代码可视化'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChart}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新建</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAISuggest}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">AI 推荐</span>
            <span className="sm:hidden">AI</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onLoad} className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">我的图表</span>
          </Button>
          <Button size="sm" onClick={onSave} className="gap-1.5">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">保存</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
