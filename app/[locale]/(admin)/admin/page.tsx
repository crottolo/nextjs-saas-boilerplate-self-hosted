'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function fetchStats() {
      try {
        const { data: users } = await authClient.admin.listUsers({
          query: { limit: 1 },
        })
        if (!ignore) {
          setStats({
            totalUsers: users?.total || 0,
            activeSessions: 0,
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
        if (!ignore) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your application</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? '...' : stats.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/users"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              View all users →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quick Actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/users"
              className="block text-sm text-primary hover:underline"
            >
              Manage users
            </Link>
            <Link
              href="/admin/sessions"
              className="block text-sm text-primary hover:underline"
            >
              View sessions
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
