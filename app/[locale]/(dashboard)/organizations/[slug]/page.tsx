'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
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
  const t = useTranslations('organizations')
  const tCommon = useTranslations('common')
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
      toast.error(t('invitations.cancelFailed'))
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
      toast.success(t('invitations.resendSuccess'))
    } catch (error) {
      console.error('Failed to resend invitation:', error)
      toast.error(t('invitations.resendFailed'))
    }
  }

  async function handleDeleteOrganization() {
    if (!org) return
    try {
      await authClient.organization.delete({ organizationId: org.id })
      router.push('/organizations')
    } catch (error) {
      console.error('Failed to delete organization:', error)
      toast.error(t('dangerZone.deleteFailed'))
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
        <h2 className="text-xl font-semibold">{t('detail.notFound')}</h2>
        <p className="text-muted-foreground">
          {t('detail.notFoundDescription')}
        </p>
        <Button className="mt-4" onClick={() => router.push('/organizations')}>
          {t('detail.backToOrgs')}
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
            {t('detail.members')} ({org.members.length})
          </TabsTrigger>
          {canInvite && (
            <TabsTrigger value="invitations">
              {t('invitations.title')} ({pendingInvitations.length})
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="settings">{t('detail.settings')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.members')}</CardTitle>
              <CardDescription>
                {t('detail.membersDescription')}
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
                <CardTitle>{t('invitations.pendingTitle')}</CardTitle>
                <CardDescription>
                  {t('invitations.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {t('invitations.empty')}
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
                                {t('invitations.expires')}{' '}
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
                            {t('invitations.resend')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelInvitationId(inv.id)}
                          >
                            {t('invitations.cancel')}
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
                <CardTitle className="text-destructive">
                  {t('dangerZone.title')}
                </CardTitle>
                <CardDescription>{t('dangerZone.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('dangerZone.deleteTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('dangerZone.deleteDescription')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {tCommon('delete')}
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
            <AlertDialogTitle>
              {t('invitations.cancelDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('invitations.cancelDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('invitations.cancelDialog.keep')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation}>
              {t('invitations.cancelDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Organization Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dangerZone.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dangerZone.deleteConfirm', { name: org.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrganization}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
