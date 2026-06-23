'use client'

import { Github, Heart } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-1.5">
          <span>基于</span>
          <span className="font-medium text-foreground">ECharts 6</span>
          <span>·</span>
          <span className="font-medium text-foreground">Mermaid 11</span>
          <span>·</span>
          <span className="font-medium text-foreground">AntV G6 5</span>
          <span>构建</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            为非代码人员友好设计 <Heart className="h-3 w-3 fill-current text-rose-500" />
          </span>
          <a
            href="https://echarts.apache.org/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            文档
          </a>
          <span className="flex items-center gap-1">
            <Github className="h-3 w-3" /> Open Source
          </span>
        </div>
      </div>
    </footer>
  )
}
