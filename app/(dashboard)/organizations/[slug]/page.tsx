'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Clock } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembersTable } from '@/components/organization/members-table'
import { InviteDialog } from '@/components/organization/invite-dialog'
import { RoleBadge } from '@/components/organization/role-badge'
import { Skeleton } from '@/components/ui/skeleton'

interface FullOrganization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  members: {
    id: string
    role: string
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
      image?: string | null
    }
  }[]
  invitations: {
    id: string
    email: string
    role: string | null
    status: string
    expiresAt: Date
  }[]
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [org, setOrg] = useState<FullOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const slug = params.slug as string

  useEffect(() => {
    let ignore = false
    async function fetchOrg() {
      setLoading(true)
      try {
        const { data } = await authClient.organization.getFullOrganization({
          organizationSlug: slug,
        })
        if (!ignore && data) {
          setOrg(data as FullOrganization)
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchOrg()
    return () => {
      ignore = true
    }
  }, [slug, refreshKey])

  const currentMember = org?.members.find(
    (m) => m.user.id === session?.user?.id
  )
  const currentUserRole = currentMember?.role || 'member'
  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin'
  const pendingInvitations =
    org?.invitations.filter((i) => i.status === 'pending') || []

  async function handleCancelInvitation(invitationId: string) {
    if (!confirm('Cancel this invitation?')) return
    try {
      await authClient.organization.cancelInvitation({ invitationId })
      setRefreshKey((k) => k + 1)
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Organization not found</h2>
        <p className="text-muted-foreground">
          The organization you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button className="mt-4" onClick={() => router.push('/organizations')}>
          Back to Organizations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/organizations')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground">{org.slug}</p>
        </div>
        {canInvite && (
          <InviteDialog
            organizationId={org.id}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members ({org.members.length})
          </TabsTrigger>
          {canInvite && (
            <TabsTrigger value="invitations">
              Invitations ({pendingInvitations.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                People who have access to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembersTable
                members={org.members}
                currentUserId={session?.user?.id || ''}
                currentUserRole={currentUserRole}
                organizationId={org.id}
                onUpdate={() => setRefreshKey((k) => k + 1)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canInvite && (
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations that haven&apos;t been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No pending invitations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{inv.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RoleBadge role={inv.role || 'member'} />
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires{' '}
                                {new Date(inv.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
