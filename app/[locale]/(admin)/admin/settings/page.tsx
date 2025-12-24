'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [disable2FAOpen, setDisable2FAOpen] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState('')

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setEmailMessage('')

    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('newEmail') as string

    if (!newEmail || newEmail === session?.user.email) {
      setEmailMessage(`${tCommon('error')}: ${t('changeEmail.enterDifferent')}`)
      setLoading(false)
      return
    }

    const res = await fetch('/api/admin/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail }),
    })

    if (!res.ok) {
      const data = await res.json()
      setEmailMessage(
        `${tCommon('error')}: ${data.error || t('changeEmail.failed')}`
      )
      setLoading(false)
    } else {
      await authClient.signOut()
      router.push('/')
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setPasswordMessage('')

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        `${tCommon('error')}: ${t('changePassword.passwordMismatch')}`
      )
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        `${tCommon('error')}: ${t('changePassword.passwordTooShort')}`
      )
      setLoading(false)
      return
    }

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    if (error) {
      setPasswordMessage(`${tCommon('error')}: ${error.message}`)
    } else {
      setPasswordMessage(t('changePassword.success'))
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  async function handleDisable2FA() {
    if (!disable2FAPassword) return
    setLoading(true)
    const { error } = await authClient.twoFactor.disable({
      password: disable2FAPassword,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('twoFactor.disabled'))
      setDisable2FAOpen(false)
      setDisable2FAPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('account.title')}</h1>
        <p className="text-muted-foreground">{t('account.description')}</p>
      </div>

      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('adminAlert.title')}</AlertTitle>
        <AlertDescription>{t('adminAlert.description')}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t('changeEmail.title')}</CardTitle>
          <CardDescription>{t('changeEmail.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">
                {t('changeEmail.currentEmail')}
              </Label>
              <Input
                id="currentEmail"
                type="email"
                value={session?.user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('changeEmail.newEmail')}</Label>
              <Input
                id="newEmail"
                name="newEmail"
                type="email"
                placeholder={t('changeEmail.placeholder')}
                required
              />
            </div>

            {emailMessage && (
              <p
                className={`text-sm ${emailMessage.startsWith(tCommon('error')) ? 'text-destructive' : 'text-green-600'}`}
              >
                {emailMessage}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? t('changeEmail.changing') : t('changeEmail.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('twoFactor.title')}</CardTitle>
          <CardDescription>{t('twoFactor.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('twoFactor.status')}</p>
              <p className="text-sm text-muted-foreground">
                {session?.user.twoFactorEnabled
                  ? t('twoFactor.enabled')
                  : t('twoFactor.notEnabled')}
              </p>
            </div>
            {session?.user.twoFactorEnabled ? (
              <Button
                variant="destructive"
                onClick={() => setDisable2FAOpen(true)}
                disabled={loading}
              >
                {t('twoFactor.disable')}
              </Button>
            ) : (
              <Link href="/2fa/setup">
                <Button>{t('twoFactor.enable')}</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog
        open={disable2FAOpen}
        onOpenChange={(open) => {
          setDisable2FAOpen(open)
          if (!open) setDisable2FAPassword('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('twoFactor.disableDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('twoFactor.disableDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable2fa-password">
                {t('twoFactor.disableDialog.password')}
              </Label>
              <Input
                id="disable2fa-password"
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
                placeholder={t('twoFactor.disableDialog.passwordPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisable2FAOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading || !disable2FAPassword}
            >
              {loading
                ? t('twoFactor.disableDialog.disabling')
                : t('twoFactor.disableDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword.title')}</CardTitle>
          <CardDescription>{t('changePassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t('changePassword.currentPassword')}
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('changePassword.newPassword')}
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder={t('changePassword.placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('changePassword.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            {passwordMessage && (
              <p
                className={`text-sm ${passwordMessage.startsWith(tCommon('error')) ? 'text-destructive' : 'text-green-600'}`}
              >
                {passwordMessage}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading
                ? t('changePassword.changing')
                : t('changePassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
