'use client'

import * as React from 'react'
import { I18nProvider } from '@/lib/i18n'
import { LicenseProvider } from '@/lib/license/provider'
import { ChartToolApp } from '@/components/chart-tool/chart-tool-app'

export default function Home() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    )
  }

  return (
    <I18nProvider>
      <LicenseProvider>
        <ChartToolApp />
      </LicenseProvider>
    </I18nProvider>
  )
}
