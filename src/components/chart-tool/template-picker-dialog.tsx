'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import {
  UNIFIED_CATEGORY_ORDER,
  UNIFIED_CATEGORY_ICON,
  groupUnifiedByCategory,
  type UnifiedTemplate,
  type UnifiedCategory,
} from '@/lib/chart/unified-catalog'
import { useT } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPick: (tpl: UnifiedTemplate) => void
}

const ALL_COUNT = (() => {
  // total templates
  const g = groupUnifiedByCategory()
  return UNIFIED_CATEGORY_ORDER.reduce((acc, k) => acc + g[k].length, 0)
})()

/**
 * Map a unified category to its i18n key. We can't use the static
 * `UNIFIED_CATEGORY_LABEL` (a static object can't call hooks), so we look up
 * the translation at render time via `t()`.
 */
function getCategoryLabel(cat: UnifiedCategory, t: (key: string) => string): string {
  switch (cat) {
    case 'comparison':
      return t('categories.comparison')
    case 'trend':
      return t('categories.trend')
    case 'composition':
      return t('categories.composition')
    case 'distribution':
      return t('categories.distribution')
    case 'flow':
      return t('categories.flow')
    case 'structure':
      return t('categories.structure')
    case 'relationship':
      return t('categories.relationship')
    case 'timeline':
      return t('categories.timeline')
    case 'list':
      return t('categories.list')
    case 'metric':
      return t('categories.metric')
    default:
      return cat
  }
}

export function TemplatePickerDialog({ open, onOpenChange, onPick }: Props) {
  const t = useT()
  const [keyword, setKeyword] = React.useState('')
  const [activeCat, setActiveCat] = React.useState<UnifiedCategory | 'all'>('all')

  const groups = React.useMemo(() => groupUnifiedByCategory(), [])

  const filtered = React.useMemo(() => {
    if (!keyword.trim()) return null
    const kw = keyword.toLowerCase()
    const all: UnifiedTemplate[] = []
    for (const cat of UNIFIED_CATEGORY_ORDER) all.push(...groups[cat])
    return all.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(kw) ||
        tpl.description.toLowerCase().includes(kw) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(kw)),
    )
  }, [keyword, groups])

  const visibleCategories: UnifiedCategory[] =
    activeCat === 'all' ? UNIFIED_CATEGORY_ORDER : [activeCat]

  const handlePick = (tpl: UnifiedTemplate) => {
    onPick(tpl)
    setKeyword('')
    setActiveCat('all')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setKeyword('')
          setActiveCat('all')
        }
      }}
    >
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-6xl flex-col gap-0 p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {t('templatePicker.title')}
          </DialogTitle>
          <DialogDescription>
            {t('templatePicker.description', { count: ALL_COUNT })}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="border-b px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('templatePicker.searchPlaceholder')}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Category filter (hidden when searching) */}
        {!filtered && (
          <div className="flex flex-wrap gap-1.5 border-b px-6 py-2.5">
            <CategoryChip
              active={activeCat === 'all'}
              onClick={() => setActiveCat('all')}
              label={t('templatePicker.all', { count: ALL_COUNT })}
            />
            {UNIFIED_CATEGORY_ORDER.map((cat) => (
              <CategoryChip
                key={cat}
                active={activeCat === cat}
                onClick={() => setActiveCat(cat)}
                label={`${getCategoryLabel(cat, t)} ${groups[cat].length}`}
                icon={UNIFIED_CATEGORY_ICON[cat]}
              />
            ))}
          </div>
        )}

        {/* Grid */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            {filtered ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((tplItem) => (
                  <TemplateCard key={tplItem.id} tpl={tplItem} onPick={handlePick} />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    {t('templatePicker.noResults')}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {visibleCategories.map((cat) => {
                  const list = groups[cat]
                  if (!list || list.length === 0) return null
                  return (
                    <section key={cat}>
                      <div className="mb-3 flex items-center gap-2">
                        {renderIcon(UNIFIED_CATEGORY_ICON[cat], 'h-4 w-4 text-primary')}
                        <h3 className="text-sm font-semibold">
                          {getCategoryLabel(cat, t)}
                        </h3>
                        <Badge variant="secondary" className="text-[10px]">
                          {list.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {list.map((tplItem) => (
                          <TemplateCard key={tplItem.id} tpl={tplItem} onPick={handlePick} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'hover:border-foreground/30 hover:bg-muted',
      )}
    >
      {icon && renderIcon(icon, 'h-3 w-3')}
      <span>{label}</span>
    </button>
  )
}

function TemplateCard({
  tpl,
  onPick,
}: {
  tpl: UnifiedTemplate
  onPick: (t: UnifiedTemplate) => void
}) {
  return (
    <button
      onClick={() => onPick(tpl)}
      className="group flex flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        {renderIcon(tpl.icon, 'h-5 w-5')}
      </div>
      <div>
        <div className="text-sm font-medium leading-tight">{tpl.name}</div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
          {tpl.description}
        </div>
      </div>
    </button>
  )
}

/**
 * Render a lucide icon by name. Falls back to a square if not found.
 */
function renderIcon(name: string, className?: string): React.ReactNode {
  const Icon = (LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >)[name]
  if (!Icon) return null
  return <Icon className={className} />
}
