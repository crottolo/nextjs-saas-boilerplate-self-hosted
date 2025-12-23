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

interface Session {
  id: string
  token: string
  userAgent?: string
  createdAt: string
}

export default function SecurityPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

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

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setMessage('Error: Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setMessage('Error: Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Password changed successfully!')
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  async function handleDisable2FA() {
    setLoading(true)
    const { error } = await authClient.twoFactor.disable({
      password: prompt('Enter your password to disable 2FA') || '',
    })

    if (error) {
      alert(error.message)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Manage your security settings and active sessions
        </p>
      </div>

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
                onClick={handleDisable2FA}
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

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            {message && (
              <p
                className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
              >
                {message}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </div>
  )
}
