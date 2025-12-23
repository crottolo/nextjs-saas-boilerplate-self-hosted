'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

interface Session {
  id: string
  token: string
  userAgent?: string | null
  createdAt: Date
}

export default function ProfilePage() {
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
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and security
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleUpdateProfile}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={session?.user.name || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
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
                  {loading ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {session?.user.twoFactorEnabled
                      ? 'Two-factor authentication is enabled'
                      : 'Two-factor authentication is not enabled'}
                  </p>
                </div>
                {session?.user.twoFactorEnabled ? (
                  <Button
                    variant="destructive"
                    onClick={() => setDisable2FAOpen(true)}
                    disabled={loading}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Link href="/2fa/setup">
                    <Button>Enable 2FA</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {hasCredential === false && (
            <Card>
              <CardHeader>
                <CardTitle>Set Password</CardTitle>
                <CardDescription>
                  Add a password to your account to sign in with email and
                  password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setPassword">Password</Label>
                    <Input
                      id="setPassword"
                      name="setPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setConfirmPassword">Confirm Password</Label>
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
                    {loading ? 'Setting...' : 'Set password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {hasCredential === true && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
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
                    {loading ? 'Changing...' : 'Change password'}
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
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage your active sessions across devices
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleRevokeOtherSessions}>
                  Sign out other sessions
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
                                : 'Unknown browser'}
                        </p>
                        {s.id === session?.session.id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {s.token !== session?.session.token && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(s.token)}
                      >
                        Revoke
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
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable2fa-password">Password</Label>
              <Input
                id="disable2fa-password"
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisable2FAOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading || !disable2FAPassword}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
