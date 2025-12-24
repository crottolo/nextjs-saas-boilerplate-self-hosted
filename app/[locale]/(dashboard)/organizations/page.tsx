'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and teams
          </p>
        </div>
        <Link href="/organizations/create">
          <Button>Create Organization</Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any organizations yet.
            </p>
            <Link href="/organizations/create">
              <Button className="mt-4">Create your first organization</Button>
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
                        Active
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
                    {org.members?.length || 0} member(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Role: {org.role || 'Member'}
                  </p>
                  <Link href={`/organizations/${org.id}`}>
                    <Button variant="ghost" size="sm">
                      Manage →
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
