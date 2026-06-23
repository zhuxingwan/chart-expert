'use client'

import { I18nProvider } from '@/lib/i18n'
import { LicenseProvider } from '@/lib/license/provider'
import { ChartToolApp } from '@/components/chart-tool/chart-tool-app'

export default function Home() {
  return (
    <I18nProvider>
      <LicenseProvider>
        <ChartToolApp />
      </LicenseProvider>
    </I18nProvider>
  )
}
