'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface SessionWithUser {
  id: string
  token: string
  userId: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date
  expiresAt: Date
  user?: {
    email: string
    name: string
  }
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [revokeSessionToken, setRevokeSessionToken] = useState<string | null>(
    null
  )
  const [revokeUserSessionsId, setRevokeUserSessionsId] = useState<
    string | null
  >(null)

  useEffect(() => {
    let ignore = false
    async function fetchSessions() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/sessions')
        if (res.ok && !ignore) {
          const data = await res.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
      if (!ignore) setLoading(false)
    }
    fetchSessions()
    return () => {
      ignore = true
    }
  }, [refreshKey])

  async function handleRevokeSession() {
    if (!revokeSessionToken) return
    try {
      await authClient.admin.revokeUserSession({
        sessionToken: revokeSessionToken,
      })
      setRefreshKey((k) => k + 1)
      setRevokeSessionToken(null)
    } catch (error) {
      console.error('Failed to revoke session:', error)
      toast.error('Failed to revoke session')
    }
  }

  async function handleRevokeUserSessions() {
    if (!revokeUserSessionsId) return
    try {
      await authClient.admin.revokeUserSessions({
        userId: revokeUserSessionsId,
      })
      setRefreshKey((k) => k + 1)
      setRevokeUserSessionsId(null)
    } catch (error) {
      console.error('Failed to revoke user sessions:', error)
      toast.error('Failed to revoke user sessions')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">View and manage active sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>{sessions.length} active session(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No active sessions
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {session.user?.email || session.userId}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.userAgent || 'Unknown device'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: {session.ipAddress || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(session.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeUserSessionsId(session.userId)}
                    >
                      Revoke All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRevokeSessionToken(session.token)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Single Session Dialog */}
      <AlertDialog
        open={!!revokeSessionToken}
        onOpenChange={(open) => !open && setRevokeSessionToken(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The user will be
              logged out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All User Sessions Dialog */}
      <AlertDialog
        open={!!revokeUserSessionsId}
        onOpenChange={(open) => !open && setRevokeUserSessionsId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke all sessions for this user? They
              will be logged out from all devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeUserSessions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
