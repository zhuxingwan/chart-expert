'use client'

import { BarChart3, GitFork, Wand2, Sparkles, Save, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChartEngine } from '@/types/chart'

interface Props {
  engine: ChartEngine
  onEngineChange: (e: ChartEngine) => void
  onSave: () => void
  onLoad: () => void
  onAISuggest: () => void
}

const TABS: {
  id: ChartEngine
  name: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'echarts', name: '数据图表', desc: 'ECharts · 柱状 / 折线 / 饼图 / 雷达 …', icon: BarChart3 },
  { id: 'mermaid', name: '流程与结构图', desc: 'Mermaid · 流程图 / 时序 / 思维导图 …', icon: GitFork },
  { id: 'infographic', name: '信息图', desc: 'AntV Infographic · 流程 / 列表 / 树形 / 关系 …', icon: Wand2 },
]

export function AppHeader({
  engine,
  onEngineChange,
  onSave,
  onLoad,
  onAISuggest,
}: Props) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3">
        {/* Row 1: brand + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight sm:text-lg">
                图表制作工坊
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                ECharts · Mermaid · AntV G6 · 零代码可视化
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAISuggest}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI 智能推荐</span>
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

        {/* Row 2: engine tabs */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = engine === t.id
            return (
              <button
                key={t.id}
                onClick={() => onEngineChange(t.id)}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-3 py-2 text-left transition-all',
                  active
                    ? 'bg-background shadow-sm ring-1 ring-border'
                    : 'hover:bg-background/60'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="min-w-0">
                  <div
                    className={cn(
                      'truncate text-sm font-medium',
                      active ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {t.name}
                  </div>
                  <div className="hidden truncate text-[10px] text-muted-foreground lg:block">
                    {t.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
