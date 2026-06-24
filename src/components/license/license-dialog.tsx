'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Gift, Loader2, Crown, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useLicense } from '@/lib/license/provider'
import {
  validateLicenseKey,
  generateTestLicenseKey,
  resetSubDeviceFailCount,
  type UserLicense,
} from '@/lib/license'
import { useT } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function LicenseDialog({ open, onOpenChange }: Props) {
  const t = useT()
  const { license, setLicense, resetLicense } = useLicense()
  const [licenseKey, setLicenseKey] = React.useState('')
  const [licenseEmail, setLicenseEmail] = React.useState('')
  const [verifying, setVerifying] = React.useState(false)

  const handleVerify = async () => {
    if (!licenseKey.trim() || !licenseEmail.trim()) {
      toast.error(t('toasts.enterKeyAndEmail'))
      return
    }
    setVerifying(true)
    try {
      const result = await validateLicenseKey(licenseKey, licenseEmail)
      if (result.valid && result.type && result.expiry) {
        const newLicense: UserLicense = {
          email: licenseEmail,
          error: null,
          expiry: result.expiry,
          type: result.type,
        }
        setLicense(newLicense)
        resetSubDeviceFailCount()
        // Save to localStorage using the same keys as the note app
        localStorage.setItem('licenseKey', licenseKey)
        localStorage.setItem('licenseEmail', licenseEmail)
        toast.success(t('toasts.licenseVerified'))
        onOpenChange(false)
        setLicenseKey('')
        setLicenseEmail('')
      } else {
        // Debug: show the salt and key info in console to help diagnose
        const webiconEl = document.getElementById('webicon')
        const salt = webiconEl?.getElementsByTagName('path')[0]?.getAttribute('d')?.slice(0, 50) ?? 'FIXED_DERIVE_SALT'
        console.log('License validation failed', {
          error: result.error,
          saltUsed: salt,
          keyLength: licenseKey.length,
          email: licenseEmail,
          hasWebicon: !!webiconEl,
        })
        toast.error(result.error || t('toasts.licenseVerifyFailed'))
      }
    } catch (e) {
      toast.error(t('toasts.licenseVerifyFailedWith', { error: (e as Error).message }))
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    resetLicense()
    toast.info(t('toasts.licenseRemoved'))
    onOpenChange(false)
  }

  const handleGenerateTestKey = async () => {
    const email = prompt(t('toasts.enterTestEmail'))
    if (!email || !email.trim()) {
      toast.error(t('toasts.enterValidEmail'))
      return
    }
    try {
      const generatedKey = await generateTestLicenseKey(email)
      setLicenseKey(generatedKey)
      setLicenseEmail(email)
      toast.success(t('toasts.testKeyGenerated'))
    } catch {
      toast.error(t('toasts.testKeyFailed'))
    }
  }

  const handlePurchaseClick = () => {
    window.open('https://store.payproglobal.com/checkout?products[1][id]=126640', '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {t('license.title')}
          </DialogTitle>
          <DialogDescription>
            {t('license.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Status card */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('license.currentStatus')}</span>
            <Badge variant={license.type === 'pro' ? 'default' : 'secondary'}>
              {license.type.toUpperCase()}
            </Badge>
          </div>
          {license.email && (
            <div className="text-xs">
              <span className="text-muted-foreground">{t('license.email')}</span>
              <span>{license.email}</span>
            </div>
          )}
          {license.expiry && (
            <div className="text-xs">
              <span className="text-muted-foreground">{t('license.expiry')}</span>
              <span>{new Date(license.expiry).toLocaleDateString()}</span>
            </div>
          )}
          {license.error && (
            <div className="text-xs text-destructive">{license.error}</div>
          )}
        </div>

        {/* Upgrade section for free users */}
        {license.type === 'free' && (
          <div className="text-center py-2">
            <Button
              onClick={handlePurchaseClick}
              className="w-full max-w-[280px] gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Gift className="h-4 w-4" />
              {t('license.upgradeToPro')}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t('license.unlockFeatures')}
              <a
                href="https://noterich.com/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                {t('license.viewPricing')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        )}

        {/* Input form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="license-key" className="text-xs">{t('license.licenseKey')}</Label>
            <Input
              id="license-key"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder={t('license.licenseKeyPlaceholder')}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="license-email" className="text-xs">{t('license.licenseEmail')}</Label>
            <Input
              id="license-email"
              type="email"
              value={licenseEmail}
              onChange={(e) => setLicenseEmail(e.target.value)}
              placeholder={t('license.licenseEmailPlaceholder')}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={license.type === 'free'}
            className="flex-1"
          >
            {t('actions.reset')}
          </Button>
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={verifying}
            className="flex-1 gap-1.5"
          >
            {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('actions.verify')}
          </Button>
        </div>

        {/* Test key link */}
        <button
          onClick={handleGenerateTestKey}
          className="text-center text-[11px] text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('license.generateTestKey')}
        </button>
      </DialogContent>
    </Dialog>
  )
}
