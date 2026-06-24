'use client'

import { Crown, ExternalLink } from 'lucide-react'
import { useLicense } from '@/lib/license/provider'
import { useT } from '@/lib/i18n'
import { NOTERICH_LOGO_DATA_URL } from '@/components/brand/noterich-logo'
import { cn } from '@/lib/utils'

interface Props {
  onLicenseClick?: () => void
}

export function AppFooter({ onLicenseClick }: Props) {
  const { license, isPro } = useLicense()
  const t = useT()

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs">
        {/* Left: NoteRich logo only */}
        <div className="flex items-center gap-2">
          <img
            src={NOTERICH_LOGO_DATA_URL}
            alt="NoteRich"
            style={{ width: '90px', height: '17px' }}
          />
        </div>

        {/* Right: PRO status + links */}
        <div className="flex items-center gap-3">
          {/* PRO / Free badge */}
          <button
            onClick={onLicenseClick}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
              isPro
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
            title={isPro ? t('footer.proActivated') : t('footer.upgradeToPro')}
          >
            <Crown className="h-3 w-3" />
            {license.type === 'pro' ? 'PRO' : t('footer.free')}
          </button>

          {/* Website link */}
          <a
            href="https://noterich.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            {t('footer.website')}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>

          {/* Pricing link */}
          <a
            href="https://noterich.com/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            {t('footer.pricing')}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>

          {/* Copyright */}
          <span className="text-muted-foreground">
            © {new Date().getFullYear()} NoteRich
          </span>
        </div>
      </div>
    </footer>
  )
}
