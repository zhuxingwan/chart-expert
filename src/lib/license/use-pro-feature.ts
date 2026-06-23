'use client'

import * as React from 'react'
import { useLicense } from './provider'
import { toast } from 'sonner'
import { useT, useI18n } from '@/lib/i18n'

/**
 * Hook that provides PRO feature gating.
 * Returns `isPro` and a `requirePro` function that shows a toast
 * and optionally opens the license dialog if the user is not Pro.
 */
export function useProFeature(openLicenseDialog?: () => void) {
  const { isPro } = useLicense()
  const t = useT()
  const { locale } = useI18n()
  const isZh = locale.startsWith('zh')

  const requirePro = React.useCallback((): boolean => {
    if (isPro) return true
    toast.error(
      isZh
        ? '此功能需要 Pro 授权。请升级到 Pro 后使用。'
        : 'This feature requires a Pro license. Please upgrade to Pro.',
      {
        action: openLicenseDialog
          ? {
              label: isZh ? '升级 Pro' : 'Upgrade',
              onClick: openLicenseDialog,
            }
          : undefined,
      },
    )
    return false
  }, [isPro, isZh, openLicenseDialog])

  return { isPro, requirePro }
}
