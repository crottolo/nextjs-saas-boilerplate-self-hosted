'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
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

export default function AdminSettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setEmailMessage('')

    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('newEmail') as string

    if (!newEmail || newEmail === session?.user.email) {
      setEmailMessage('Error: Enter a different email address')
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
      setEmailMessage(`Error: ${data.error || 'Failed to update email'}`)
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your admin account settings
        </p>
      </div>

      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Admin Settings</AlertTitle>
        <AlertDescription>
          You are editing admin account settings. Changes here bypass normal
          verification flows.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>
            Update your admin email address (no verification required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={session?.user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                name="newEmail"
                type="email"
                placeholder="new@email.com"
                required
              />
            </div>

            {emailMessage && (
              <p
                className={`text-sm ${emailMessage.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
              >
                {emailMessage}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
          <CardDescription>Update your admin password</CardDescription>
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

            {passwordMessage && (
              <p
                className={`text-sm ${passwordMessage.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
              >
                {passwordMessage}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
