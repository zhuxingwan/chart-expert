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
import { useT, useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function LicenseDialog({ open, onOpenChange }: Props) {
  const t = useT()
  const { locale } = useI18n()
  const { license, setLicense, resetLicense } = useLicense()
  const [licenseKey, setLicenseKey] = React.useState('')
  const [licenseEmail, setLicenseEmail] = React.useState('')
  const [verifying, setVerifying] = React.useState(false)

  const isZh = locale.startsWith('zh')

  const handleVerify = async () => {
    if (!licenseKey.trim() || !licenseEmail.trim()) {
      toast.error(isZh ? '请输入 License Key 和邮箱' : 'Please enter both License Key and Email.')
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
        toast.success(isZh ? 'License 验证成功！已解锁 Pro 功能。' : 'License verified successfully! Pro features unlocked.')
        onOpenChange(false)
        setLicenseKey('')
        setLicenseEmail('')
      } else {
        toast.error(result.error || (isZh ? 'License 验证失败。' : 'License verification failed.'))
      }
    } catch (e) {
      toast.error(isZh ? '验证失败：' + (e as Error).message : 'Verification failed: ' + (e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    resetLicense()
    toast.info(isZh ? '已移除 License，降级为免费用户。' : 'License removed. Downgraded to Free user.')
    onOpenChange(false)
  }

  const handleGenerateTestKey = async () => {
    const email = prompt(isZh ? '请输入测试用邮箱地址：' : 'Please enter the email address for testing:')
    if (!email || !email.trim()) {
      toast.error(isZh ? '请输入有效的邮箱地址。' : 'Please enter a valid email address.')
      return
    }
    try {
      const generatedKey = await generateTestLicenseKey(email)
      setLicenseKey(generatedKey)
      setLicenseEmail(email)
      toast.success(isZh ? '测试 Key 已生成并填入！' : 'Test Key generated successfully and filled in!')
    } catch {
      toast.error(isZh ? '生成测试 Key 失败' : 'Failed to generate test Key.')
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
            {isZh ? 'NoteRich Pro 授权' : 'NoteRich Pro License'}
          </DialogTitle>
          <DialogDescription>
            {isZh
              ? '验证您的 Pro 授权以解锁 SVG 下载和 Markdown 复制等高级功能。'
              : 'Verify your Pro license to unlock advanced features like SVG download and Markdown copy.'}
          </DialogDescription>
        </DialogHeader>

        {/* Status card */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{isZh ? '当前状态' : 'Current Status'}</span>
            <Badge variant={license.type === 'pro' ? 'default' : 'secondary'}>
              {license.type.toUpperCase()}
            </Badge>
          </div>
          {license.email && (
            <div className="text-xs">
              <span className="text-muted-foreground">{isZh ? '邮箱：' : 'Email: '}</span>
              <span>{license.email}</span>
            </div>
          )}
          {license.expiry && (
            <div className="text-xs">
              <span className="text-muted-foreground">{isZh ? '到期：' : 'Expiry: '}</span>
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
              {isZh ? '升级到 Pro' : 'Upgrade to Pro'}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {isZh ? '解锁高级功能。' : 'Unlock advanced features. '}
              <a
                href="https://noterich.com/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                {isZh ? '查看定价 →' : 'View Pricing →'}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        )}

        {/* Input form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="license-key" className="text-xs">{isZh ? 'License Key' : 'License Key'}</Label>
            <Input
              id="license-key"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder={isZh ? '输入 License Key...' : 'Enter license key...'}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="license-email" className="text-xs">{isZh ? '邮箱' : 'Email'}</Label>
            <Input
              id="license-email"
              type="email"
              value={licenseEmail}
              onChange={(e) => setLicenseEmail(e.target.value)}
              placeholder={isZh ? '输入关联邮箱...' : 'Enter associated email...'}
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
            {isZh ? '重置' : 'Reset'}
          </Button>
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={verifying}
            className="flex-1 gap-1.5"
          >
            {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isZh ? '验证' : 'Verify'}
          </Button>
        </div>

        {/* Test key link */}
        <button
          onClick={handleGenerateTestKey}
          className="text-center text-[11px] text-muted-foreground hover:text-foreground hover:underline"
        >
          {isZh ? '生成测试 Key' : 'Generate Test Key'}
        </button>
      </DialogContent>
    </Dialog>
  )
}
