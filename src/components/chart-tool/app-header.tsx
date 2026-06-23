'use client'

import { Sparkles, Save, FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './language-switcher'
import { useT } from '@/lib/i18n'
import { NoteRichIcon } from '@/components/brand/noterich-logo'

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
  const t = useT()
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {/* Brand: NoteRich icon + product name */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <NoteRichIcon size={20} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight sm:text-base">
              NoteRich <span className="text-muted-foreground font-normal">{t('app.title')}</span>
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {templateName ? t('app.current', { name: templateName }) : t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChart}
            className="h-8 gap-1.5 px-2 sm:px-3"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.new')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAISuggest}
            className="h-8 gap-1.5 px-2 sm:px-3"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">{t('actions.aiSuggest')}</span>
            <span className="sm:hidden">{t('actions.ai')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onLoad} className="h-8 gap-1.5 px-2 sm:px-3">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.load')}</span>
          </Button>
          <Button size="sm" onClick={onSave} className="h-8 gap-1.5 px-2 sm:px-3">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.save')}</span>
          </Button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
