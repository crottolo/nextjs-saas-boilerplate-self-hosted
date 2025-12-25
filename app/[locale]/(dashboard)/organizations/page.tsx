'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Infinity, Building2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
  role?: string
  members?: { id: string }[]
}

interface UserLimits {
  plan: {
    id: string
    name: string
    maxOrganizations: number
  }
  usage: {
    organizationsOwned: number
  }
  canCreateOrganization: boolean
}

export default function OrganizationsPage() {
  const t = useTranslations('organizations')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [limits, setLimits] = useState<UserLimits | null>(null)

  // Use reactive hook for active organization
  const { data: activeOrg } = authClient.useActiveOrganization()

  useEffect(() => {
    async function fetchData() {
      const [orgsRes, limitsRes] = await Promise.all([
        authClient.organization.list(),
        fetch('/api/user/limits')
          .then((r) => r.json())
          .catch(() => null),
      ])
      if (orgsRes.data) {
        setOrganizations(orgsRes.data as Organization[])
      }
      if (limitsRes && !limitsRes.error) {
        setLimits(limitsRes)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleToggleActive(orgId: string, isCurrentlyActive: boolean) {
    if (isCurrentlyActive) {
      await authClient.organization.setActive({ organizationId: null })
    } else {
      await authClient.organization.setActive({ organizationId: orgId })
    }
    router.refresh()
  }

  if (loading) {
    return <p>{tCommon('loading')}</p>
  }

  // Calculate usage percentage for progress bar
  const usagePercent = limits
    ? limits.plan.maxOrganizations === -1
      ? 0
      : (limits.usage.organizationsOwned / limits.plan.maxOrganizations) * 100
    : 0
  const isAtLimit = limits ? !limits.canCreateOrganization : false
  const isNearLimit = usagePercent >= 80 && !isAtLimit

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Limits Badge */}
          {limits && (
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  isAtLimit
                    ? 'destructive'
                    : isNearLimit
                      ? 'secondary'
                      : 'outline'
                }
                className="flex items-center gap-1"
              >
                <Building2 className="h-3 w-3" />
                {limits.plan.maxOrganizations === -1 ? (
                  <span className="flex items-center gap-1">
                    {limits.usage.organizationsOwned}
                    <Infinity className="h-3 w-3" />
                  </span>
                ) : (
                  `${limits.usage.organizationsOwned}/${limits.plan.maxOrganizations}`
                )}
              </Badge>
              {limits.plan.maxOrganizations !== -1 && (
                <Progress value={usagePercent} className="w-16 h-2" />
              )}
            </div>
          )}

          {/* Create Button or Upgrade Link */}
          {isAtLimit ? (
            <Button asChild variant="default">
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('upgrade')}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/organizations/create">{t('create')}</Link>
            </Button>
          )}
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t('empty')}</p>
            <Link href="/organizations/create">
              <Button className="mt-4">{t('createFirst')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => {
            const isActive = activeOrg?.id === org.id
            return (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${org.id}`} className="text-xs">
                        {t('active')}
                      </Label>
                      <Switch
                        id={`active-${org.id}`}
                        checked={isActive}
                        onCheckedChange={() =>
                          handleToggleActive(org.id, isActive)
                        }
                      />
                    </div>
                  </div>
                  <CardDescription>
                    {t('detail.membersCount', {
                      count: org.members?.length || 0,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('role', { role: org.role || 'Member' })}
                  </p>
                  <Link href={`/organizations/${org.id}`}>
                    <Button variant="ghost" size="sm">
                      {t('manage')} →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
