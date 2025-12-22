"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    const { data } = await authClient.organization.list()
    if (data) {
      setOrganizations(data)
    }
    setLoading(false)
  }

  async function handleSetActive(orgId: string) {
    await authClient.organization.setActive({
      organizationId: orgId,
    })
    loadOrganizations()
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
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  {org.isActive && (
                    <Badge>Active</Badge>
                  )}
                </div>
                <CardDescription>
                  {org.members?.length || 0} member(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Role: {org.role || "Member"}
                </p>
                <div className="flex gap-2">
                  {!org.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(org.id)}
                    >
                      Set Active
                    </Button>
                  )}
                  <Link href={`/organizations/${org.id}`}>
                    <Button variant="ghost" size="sm">
                      Manage →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
