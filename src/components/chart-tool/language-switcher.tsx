'use client'

import * as React from 'react'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useI18n, SUPPORTED_LOCALES, LOCALE_NAMES } from '@/lib/i18n'
import { toast } from 'sonner'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = React.useState(false)

  const currentName = LOCALE_NAMES[locale] ?? locale

  const handleSelect = (newLocale: string) => {
    setLocale(newLocale)
    setOpen(false)
    toast.success(`${LOCALE_NAMES[newLocale] ?? newLocale}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5', compact && 'px-2')}
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">{currentName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <ScrollArea className="h-[300px]">
          <div className="grid gap-0.5 p-1.5">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={cn(
                  'flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  locale === loc
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <span>{LOCALE_NAMES[loc] ?? loc}</span>
                {locale === loc && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
