'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [message, setMessage] = useState('')

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('newEmail') as string

    if (!newEmail || newEmail === session?.user.email) {
      setMessage('Error: Enter a different email address')
      setLoading(false)
      return
    }

    // Usa API custom per aggiornare direttamente nel DB (no email verifica)
    const res = await fetch('/api/admin/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail }),
    })

    if (!res.ok) {
      const data = await res.json()
      setMessage(`Error: ${data.error || 'Failed to update email'}`)
      setLoading(false)
    } else {
      // Signout e redirect al login
      await authClient.signOut()
      router.push('/')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account</p>
      </div>

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

            {message && (
              <p
                className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}
              >
                {message}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
