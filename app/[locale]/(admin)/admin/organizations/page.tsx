'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Search,
  Trash2,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: string
  memberCount: number
  ownerName: string | null
  ownerEmail: string | null
}

export default function AdminOrganizationsPage() {
  const t = useTranslations('admin.organizations')
  const tCommon = useTranslations('common')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  useEffect(() => {
    let ignore = false
    async function fetchOrganizations() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)

        const response = await fetch(`/api/admin/organizations?${params}`)
        const data = await response.json()

        if (!ignore && data.organizations) {
          setOrganizations(data.organizations)
          setTotal(data.total)
        }
      } catch {
        if (!ignore) toast.error('Failed to load organizations')
      }
      if (!ignore) setLoading(false)
    }
    fetchOrganizations()
    return () => {
      ignore = true
    }
  }, [search, refreshKey])

  async function handleDeleteOrganization() {
    if (!selectedOrg) return
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrg.id }),
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || t('toast.deleteFailed'))
      } else {
        toast.success(t('toast.deleted', { count: data.membersRemoved }))
        setDeleteDialogOpen(false)
        setSelectedOrg(null)
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error(t('toast.deleteFailed'))
    }
  }

  const orphanedOrgs = organizations.filter((org) => org.memberCount === 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('descriptionWithTotal', { total })}
          </p>
        </div>
      </div>

      {orphanedOrgs.length > 0 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">
              {t('orphaned', { count: orphanedOrgs.length })}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('orphanedWarning')}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.name')}</TableHead>
              <TableHead>{t('columns.slug')}</TableHead>
              <TableHead>{t('columns.owner')}</TableHead>
              <TableHead>{t('columns.members')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {tCommon('loading')}
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('noOrgs')}
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.slug}
                  </TableCell>
                  <TableCell>
                    {org.ownerName ? (
                      <div>
                        <div className="font-medium">{org.ownerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {org.ownerEmail}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{org.memberCount}</span>
                      {org.memberCount === 0 && (
                        <Badge variant="destructive">
                          {t('orphanedBadge')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {tCommon('actions')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedOrg(org)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('deleteAction')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="py-4">
              <p className="font-medium">{selectedOrg.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedOrg.slug} -{' '}
                {t('deleteDialog.memberCount', {
                  count: selectedOrg.memberCount,
                })}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrganization}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
