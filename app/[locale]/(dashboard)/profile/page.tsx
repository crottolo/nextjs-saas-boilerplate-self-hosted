'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { logActivityClient } from '@/lib/activity-client'

interface Session {
  id: string
  token: string
  userAgent?: string | null
  createdAt: Date
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const t2FA = useTranslations('twoFactor')
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [newPasswordMessage, setNewPasswordMessage] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [disable2FAOpen, setDisable2FAOpen] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState('')
  const [hasCredential, setHasCredential] = useState<boolean | null>(null)

  useEffect(() => {
    let ignore = false
    async function fetchSessions() {
      const { data } = await authClient.listSessions()
      if (!ignore && data) {
        setSessions(data as Session[])
      }
    }
    fetchSessions()
    return () => {
      ignore = true
    }
  }, [refreshKey])

  useEffect(() => {
    let ignore = false
    async function checkCredential() {
      try {
        const response = await fetch('/api/auth/has-credential')
        const data = await response.json()
        if (!ignore) {
          setHasCredential(data.hasCredential)
        }
      } catch {
        if (!ignore) setHasCredential(false)
      }
    }
    checkCredential()
    return () => {
      ignore = true
    }
  }, [])

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setProfileMessage('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phoneNumber = formData.get('phoneNumber') as string

    const { error } = await authClient.updateUser({
      name,
      phoneNumber: phoneNumber || undefined,
    })

    if (error) {
      setProfileMessage(`Error: ${error.message}`)
    } else {
      setProfileMessage('Profile updated successfully!')
      logActivityClient('profile_updated')
    }
    setLoading(false)
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
      setPasswordMessage('Error: Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage('Error: Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    if (error) {
      setPasswordMessage(`Error: ${error.message}`)
    } else {
      setPasswordMessage('Password changed successfully!')
      logActivityClient('password_change')
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNewPasswordMessage('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('setPassword') as string
    const confirmPassword = formData.get('setConfirmPassword') as string

    if (password !== confirmPassword) {
      setNewPasswordMessage('Error: Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setNewPasswordMessage('Error: Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setNewPasswordMessage(`Error: ${data.error}`)
      } else {
        setNewPasswordMessage(
          'Password set successfully! You can now sign in with email and password.'
        )
        setHasCredential(true)
        ;(e.target as HTMLFormElement).reset()
      }
    } catch {
      setNewPasswordMessage('Error: Failed to set password')
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
      toast.success('Two-factor authentication disabled')
      logActivityClient('2fa_disabled')
      setDisable2FAOpen(false)
      setDisable2FAPassword('')
    }
    setLoading(false)
  }

  async function handleRevokeSession(sessionToken: string) {
    await authClient.revokeSession({ token: sessionToken })
    setRefreshKey((k) => k + 1)
  }

  async function handleRevokeOtherSessions() {
    await authClient.revokeOtherSessions()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('tabs.sessions')}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('personal.title')}</CardTitle>
              <CardDescription>{t('personal.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                currentImage={session?.user.image}
                name={session?.user.name}
              />
              <form
                onSubmit={handleUpdateProfile}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">{t('personal.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('personal.emailHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('personal.name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={session?.user.name || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('personal.phone')}</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+39 333 1234567"
                    defaultValue={
                      (session?.user as { phoneNumber?: string })
                        ?.phoneNumber || ''
                    }
                  />
                </div>

                {profileMessage && (
                  <p
                    className={`text-sm ${profileMessage.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
                  >
                    {profileMessage}
                  </p>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? tCommon('saving') : tCommon('saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.twoFactor.title')}</CardTitle>
              <CardDescription>
                {t('security.twoFactor.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t('security.twoFactor.status')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session?.user.twoFactorEnabled
                      ? t('security.twoFactor.enabled')
                      : t('security.twoFactor.disabled')}
                  </p>
                </div>
                {session?.user.twoFactorEnabled ? (
                  <Button
                    variant="destructive"
                    onClick={() => setDisable2FAOpen(true)}
                    disabled={loading}
                  >
                    {t('security.twoFactor.disable')}
                  </Button>
                ) : (
                  <Link href="/2fa/setup">
                    <Button>{t('security.twoFactor.enable')}</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {hasCredential === false && (
            <Card>
              <CardHeader>
                <CardTitle>{t('security.setPassword.title')}</CardTitle>
                <CardDescription>
                  {t('security.setPassword.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setPassword">
                      {t('security.setPassword.password')}
                    </Label>
                    <Input
                      id="setPassword"
                      name="setPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setConfirmPassword">
                      {t('security.setPassword.confirmPassword')}
                    </Label>
                    <Input
                      id="setConfirmPassword"
                      name="setConfirmPassword"
                      type="password"
                      required
                    />
                  </div>

                  {newPasswordMessage && (
                    <p
                      className={`text-sm ${newPasswordMessage.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
                    >
                      {newPasswordMessage}
                    </p>
                  )}

                  <Button type="submit" disabled={loading}>
                    {loading
                      ? t('security.setPassword.submitting')
                      : t('security.setPassword.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {hasCredential === true && (
            <Card>
              <CardHeader>
                <CardTitle>{t('security.changePassword.title')}</CardTitle>
                <CardDescription>
                  {t('security.changePassword.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {t('security.changePassword.currentPassword')}
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
                      {t('security.changePassword.newPassword')}
                    </Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t('security.changePassword.confirmPassword')}
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
                      className={`text-sm ${passwordMessage.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
                    >
                      {passwordMessage}
                    </p>
                  )}

                  <Button type="submit" disabled={loading}>
                    {loading
                      ? t('security.changePassword.submitting')
                      : t('security.changePassword.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('sessions.title')}</CardTitle>
                  <CardDescription>{t('sessions.description')}</CardDescription>
                </div>
                <Button variant="outline" onClick={handleRevokeOtherSessions}>
                  {t('sessions.signOutOthers')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {s.userAgent?.includes('Chrome')
                            ? 'Chrome'
                            : s.userAgent?.includes('Firefox')
                              ? 'Firefox'
                              : s.userAgent?.includes('Safari')
                                ? 'Safari'
                                : tCommon('unknown')}
                        </p>
                        {s.id === session?.session.id && (
                          <Badge variant="secondary">
                            {t('sessions.current')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {s.token !== session?.session.token && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(s.token)}
                      >
                        {t('sessions.revoke')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <DialogTitle>{t2FA('disable.title')}</DialogTitle>
            <DialogDescription>{t2FA('disable.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable2fa-password">
                {t('security.changePassword.currentPassword')}
              </Label>
              <Input
                id="disable2fa-password"
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
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
              {loading ? t2FA('disable.submitting') : t2FA('disable.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
