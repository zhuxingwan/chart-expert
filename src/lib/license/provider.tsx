'use client'

import * as React from 'react'
import {
  type UserLicense,
  FREE_LICENSE,
  loadStoredLicense,
  saveStoredLicense,
  clearStoredLicense,
  isProUser as checkIsProUser,
} from './index'

interface LicenseContextValue {
  license: UserLicense
  isPro: boolean
  setLicense: (license: UserLicense) => void
  resetLicense: () => void
}

const LicenseContext = React.createContext<LicenseContextValue>({
  license: FREE_LICENSE,
  isPro: false,
  setLicense: () => {},
  resetLicense: () => {},
})

export function useLicense() {
  return React.useContext(LicenseContext)
}

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [license, setLicenseState] = React.useState<UserLicense>(FREE_LICENSE)

  // Load stored license on mount (client-side only)
  React.useEffect(() => {
    setLicenseState(loadStoredLicense())
  }, [])

  const setLicense = React.useCallback((newLicense: UserLicense) => {
    setLicenseState(newLicense)
    saveStoredLicense(newLicense)
  }, [])

  const resetLicense = React.useCallback(() => {
    setLicenseState(FREE_LICENSE)
    clearStoredLicense()
  }, [])

  const isPro = checkIsProUser(license)

  return (
    <LicenseContext.Provider value={{ license, isPro, setLicense, resetLicense }}>
      {children}
    </LicenseContext.Provider>
  )
}
