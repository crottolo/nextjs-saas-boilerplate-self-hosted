"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    setLoading(true)
    const { data } = await authClient.admin.listSessions({
      query: { limit: 50 },
    })
    if (data) {
      setSessions(data.sessions || [])
    }
    setLoading(false)
  }

  async function handleRevokeSession(token: string) {
    if (!confirm("Are you sure you want to revoke this session?")) return
    await authClient.admin.revokeSession({ sessionToken: token })
    loadSessions()
  }

  async function handleRevokeUserSessions(userId: string) {
    if (!confirm("Are you sure you want to revoke all sessions for this user?")) return
    await authClient.admin.revokeUserSessions({ userId })
    loadSessions()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">
          View and manage active sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            {sessions.length} active session(s)
          </CardDescription>
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
                      {session.isCurrent && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.userAgent || "Unknown device"}
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
                      onClick={() => handleRevokeUserSessions(session.userId)}
                    >
                      Revoke All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeSession(session.token)}
                      disabled={session.isCurrent}
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
    </div>
  )
}
