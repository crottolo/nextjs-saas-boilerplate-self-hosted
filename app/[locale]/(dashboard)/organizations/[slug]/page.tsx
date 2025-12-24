'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Clock, Trash2 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

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
  const [cancelInvitationId, setCancelInvitationId] = useState<string | null>(
    null
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const slug = params.slug as string

  useEffect(() => {
    let ignore = false
    async function fetchOrg() {
      setLoading(true)
      try {
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId: slug },
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
  const isOwner = currentUserRole === 'owner'
  const canInvite = isOwner || currentUserRole === 'admin'
  const pendingInvitations =
    org?.invitations.filter((i) => i.status === 'pending') || []

  async function handleCancelInvitation() {
    if (!cancelInvitationId) return
    try {
      await authClient.organization.cancelInvitation({
        invitationId: cancelInvitationId,
      })
      setRefreshKey((k) => k + 1)
      setCancelInvitationId(null)
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
      toast.error('Failed to cancel invitation')
    }
  }

  async function handleResendInvitation(email: string, role: string | null) {
    if (!org) return
    try {
      await authClient.organization.inviteMember({
        email,
        role: (role || 'member') as 'member' | 'admin' | 'owner',
        organizationId: org.id,
        resend: true,
      })
      toast.success('Invitation resent successfully!')
    } catch (error) {
      console.error('Failed to resend invitation:', error)
      toast.error('Failed to resend invitation')
    }
  }

  async function handleDeleteOrganization() {
    if (!org) return
    try {
      await authClient.organization.delete({ organizationId: org.id })
      router.push('/organizations')
    } catch (error) {
      console.error('Failed to delete organization:', error)
      toast.error('Failed to delete organization')
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
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleResendInvitation(inv.email, inv.role)
                            }
                          >
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelInvitationId(inv.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="settings" className="mt-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Organization</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this organization and all its data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Cancel Invitation Dialog */}
      <AlertDialog
        open={!!cancelInvitationId}
        onOpenChange={(open) => !open && setCancelInvitationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? The invited user
              will no longer be able to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation}>
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Organization Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{org.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrganization}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
