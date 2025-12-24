'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  LogIn,
  LogOut,
  Key,
  Shield,
  UserCircle,
  Mail,
  CreditCard,
  Building2,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityLog {
  id: string
  action: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  password_change: <Key className="h-4 w-4" />,
  password_reset: <Key className="h-4 w-4" />,
  '2fa_enabled': <Shield className="h-4 w-4" />,
  '2fa_disabled': <Shield className="h-4 w-4" />,
  profile_updated: <UserCircle className="h-4 w-4" />,
  email_verified: <Mail className="h-4 w-4" />,
  subscription_upgraded: <CreditCard className="h-4 w-4" />,
  subscription_cancelled: <CreditCard className="h-4 w-4" />,
  organization_created: <Building2 className="h-4 w-4" />,
  organization_joined: <Building2 className="h-4 w-4" />,
  member_invited: <Users className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  login: 'Signed in',
  logout: 'Signed out',
  password_change: 'Changed password',
  password_reset: 'Reset password',
  '2fa_enabled': 'Enabled two-factor authentication',
  '2fa_disabled': 'Disabled two-factor authentication',
  profile_updated: 'Updated profile',
  email_verified: 'Verified email address',
  subscription_upgraded: 'Upgraded subscription',
  subscription_cancelled: 'Cancelled subscription',
  organization_created: 'Created organization',
  organization_joined: 'Joined organization',
  member_invited: 'Invited team member',
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchLogs = async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    try {
      const res = await fetch(
        `/api/activity?limit=${limit}&offset=${currentOffset}`
      )
      const data = await res.json()
      if (reset) {
        setLogs(data.logs)
      } else {
        setLogs((prev) => [...prev, ...data.logs])
      }
      setHasMore(data.logs.length === limit)
      setOffset(currentOffset + data.logs.length)
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = () => {
    fetchLogs()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground mt-2">
          Your recent account activity and security events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {actionIcons[log.action] || (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {actionLabels[log.action] || log.action}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground truncate">
                        {log.details}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {log.ipAddress && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {log.ipAddress}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="pt-4 text-center">
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
