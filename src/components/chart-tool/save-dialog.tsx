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
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setTitle(`我的${engine === 'echarts' ? '数据图表' : engine === 'mermaid' ? '流程图' : '信息图'} ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  }, [open, engine])

  const handleSave = async () => {
    const config = getConfig()
    if (!config) {
      toast.error('当前没有可保存的内容')
      return
    }
    setSaving(true)
    try {
      const type = (config as { type?: string }).type ?? 'unknown'
      let thumbnail: string | undefined
      if (previewRef.current) {
        thumbnail = await generateThumbnail(previewRef.current)
      }
      await saveChart({ title: title || '未命名图表', engine, type, config, thumbnail })
      toast.success('已保存到我的图表')
      onOpenChange(false)
    } catch (e) {
      toast.error('保存失败：' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>保存图表</DialogTitle>
          <DialogDescription>
            给图表起一个名字，方便日后查找与复用。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">图表名称</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：2024 年季度销售对比"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
