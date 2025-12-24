'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AdminDashboardPage() {
  const t = useTranslations('admin')
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
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('totalUsers')}</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? '...' : stats.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/users"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {t('viewAllUsers')} →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('quickActions')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/users"
              className="block text-sm text-primary hover:underline"
            >
              {t('manageUsers')}
            </Link>
            <Link
              href="/admin/sessions"
              className="block text-sm text-primary hover:underline"
            >
              {t('viewSessions')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
