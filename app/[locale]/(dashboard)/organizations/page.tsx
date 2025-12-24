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

interface Organization {
  id: string
  name: string
  role?: string
  members?: { id: string }[]
}

export default function OrganizationsPage() {
  const t = useTranslations('organizations')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  // Use reactive hook for active organization
  const { data: activeOrg } = authClient.useActiveOrganization()

  useEffect(() => {
    async function fetchOrgs() {
      const { data } = await authClient.organization.list()
      if (data) {
        setOrganizations(data as Organization[])
      }
      setLoading(false)
    }
    fetchOrgs()
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Link href="/organizations/create">
          <Button>{t('create')}</Button>
        </Link>
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
