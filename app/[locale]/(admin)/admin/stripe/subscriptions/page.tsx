'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users, CreditCard, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Subscription {
  id: string
  plan: string
  status: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  periodStart: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialStart: string | null
  trialEnd: string | null
  createdAt: string
  userName: string | null
  userEmail: string | null
  userId: string | null
}

interface Stats {
  total: number
  active: number
  trialing: number
  canceled: number
  pastDue: number
}

export default function AdminStripeSubscriptionsPage() {
  const t = useTranslations('admin.stripe.subscriptions')
  const tCommon = useTranslations('common')

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    trialing: 0,
    canceled: 0,
    pastDue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter, search])

  async function fetchSubscriptions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/stripe/subscriptions?${params}`)
      const data = await res.json()

      if (data.subscriptions) {
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
      }
    } catch {
      toast.error(t('toast.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{t('status.active')}</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500">{t('status.trialing')}</Badge>
      case 'canceled':
        return <Badge variant="secondary">{t('status.canceled')}</Badge>
      case 'past_due':
        return <Badge variant="destructive">{t('status.pastDue')}</Badge>
      case 'incomplete':
        return <Badge variant="outline">{t('status.incomplete')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.total')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.active')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.trialing')}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.trialing}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.pastDue')}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pastDue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="trialing">{t('status.trialing')}</SelectItem>
            <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
            <SelectItem value="past_due">{t('status.pastDue')}</SelectItem>
            <SelectItem value="incomplete">{t('status.incomplete')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.user')}</TableHead>
              <TableHead>{t('table.plan')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.periodEnd')}</TableHead>
              <TableHead>{t('table.created')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {tCommon('loading')}
                </TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {sub.userName || t('table.noName')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sub.userEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(sub.status)}
                      {sub.cancelAtPeriodEnd && (
                        <span className="text-xs text-muted-foreground">
                          {t('table.canceling')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.periodEnd)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
