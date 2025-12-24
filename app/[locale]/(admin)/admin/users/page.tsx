'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
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
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Ban,
  Check,
  Shield,
  User,
  Key,
  Pencil,
  Eye,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserType {
  id: string
  name?: string
  email: string
  phoneNumber?: string
  banned?: boolean
  emailVerified?: boolean
  role?: string
  createdAt: string
  stripeCustomerId?: string | null
}

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 10

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'admin' | ''>('')
  const [editStripeCustomerId, setEditStripeCustomerId] = useState('')

  useEffect(() => {
    let ignore = false
    async function fetchUsers() {
      setLoading(true)
      const { data } = await authClient.admin.listUsers({
        query: {
          limit,
          offset: page * limit,
          searchValue: search || undefined,
          searchField: 'email',
          searchOperator: 'contains',
        },
      })
      if (!ignore && data) {
        setUsers(data.users as UserType[])
        setTotal(data.total)
      }
      if (!ignore) setLoading(false)
    }
    fetchUsers()
    return () => {
      ignore = true
    }
  }, [page, search, refreshKey])

  // Handlers
  async function handleBanUser(userId: string) {
    const { error } = await authClient.admin.banUser({ userId })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.banned'))
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleUnbanUser(userId: string) {
    const { error } = await authClient.admin.unbanUser({ userId })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.unbanned'))
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || t('toast.deleteFailed'))
      } else {
        const msg =
          data.deletedOrganizations > 0
            ? t('toast.deletedWithOrgs', { count: data.deletedOrganizations })
            : t('toast.deleted')
        toast.success(msg)
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error(t('toast.deleteFailed'))
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    const { error } = await authClient.admin.createUser({
      email,
      password,
      name,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.created'))
      setCreateDialogOpen(false)
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleSetRole(userId: string, role: 'user' | 'admin') {
    const { error } = await authClient.admin.setRole({ userId, role })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.roleUpdated', { role }))
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return
    if (newPassword.length < 8) {
      toast.error(t('toast.passwordMinLength'))
      return
    }
    const { error } = await authClient.admin.setUserPassword({
      userId: selectedUser.id,
      newPassword,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.passwordReset'))
      setResetPasswordDialogOpen(false)
      setNewPassword('')
      setSelectedUser(null)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return

    // Update user data (name, email, phone, stripeCustomerId)
    const { error: updateError } = await authClient.admin.updateUser({
      userId: selectedUser.id,
      data: {
        name: editName || undefined,
        email: editEmail || undefined,
        phoneNumber: editPhone || undefined,
        stripeCustomerId: editStripeCustomerId || null,
      },
    })

    if (updateError) {
      toast.error(updateError.message)
      return
    }

    // Update role separately if changed
    if (
      (editRole === 'user' || editRole === 'admin') &&
      editRole !== selectedUser.role
    ) {
      const { error: roleError } = await authClient.admin.setRole({
        userId: selectedUser.id,
        role: editRole,
      })
      if (roleError) {
        toast.error(roleError.message)
        return
      }
    }

    toast.success(t('toast.updated'))
    setEditDialogOpen(false)
    setSelectedUser(null)
    setRefreshKey((k) => k + 1)
  }

  async function handleImpersonate(userId: string) {
    const { error } = await authClient.admin.impersonateUser({ userId })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('toast.impersonating'))
      router.push('/dashboard')
    }
  }

  function openEditDialog(user: UserType) {
    setSelectedUser(user)
    setEditName(user.name || '')
    setEditEmail(user.email)
    setEditPhone(user.phoneNumber || '')
    setEditRole((user.role as 'user' | 'admin') || 'user')
    setEditStripeCustomerId(user.stripeCustomerId || '')
    setEditDialogOpen(true)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description', { total })}</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>{t('createUser.title')}</DialogTitle>
                <DialogDescription>
                  {t('createUser.description')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('createUser.name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t('createUser.namePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('createUser.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('createUser.emailPlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('createUser.password')}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('createUser.passwordPlaceholder')}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button type="submit">{t('createUser.submit')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.name')}</TableHead>
              <TableHead>{t('columns.email')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.role')}</TableHead>
              <TableHead>{t('columns.stripeId')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {tCommon('loading')}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || t('noName')}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.banned && (
                        <Badge variant="destructive">
                          {t('status.banned')}
                        </Badge>
                      )}
                      {user.emailVerified ? (
                        <Badge variant="secondary">
                          {t('status.verified')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t('status.unverified')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge>{t('roles.admin')}</Badge>
                    ) : (
                      <Badge variant="outline">{t('roles.user')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {user.stripeCustomerId
                      ? `${user.stripeCustomerId.slice(0, 12)}...`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
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

                        {/* Edit User */}
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('actions.edit')}
                        </DropdownMenuItem>

                        {/* Reset Password */}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setNewPassword('')
                            setResetPasswordDialogOpen(true)
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          {t('actions.resetPassword')}
                        </DropdownMenuItem>

                        {/* Set Role */}
                        {user.role === 'admin' ? (
                          <DropdownMenuItem
                            onClick={() => handleSetRole(user.id, 'user')}
                          >
                            <User className="mr-2 h-4 w-4" />
                            {t('actions.makeUser')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleSetRole(user.id, 'admin')}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {t('actions.makeAdmin')}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Impersonate */}
                        <DropdownMenuItem
                          onClick={() => handleImpersonate(user.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('actions.impersonate')}
                        </DropdownMenuItem>

                        {/* View Sessions */}
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/sessions?userId=${user.id}`)
                          }
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          {t('actions.viewSessions')}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Ban/Unban */}
                        {user.banned ? (
                          <DropdownMenuItem
                            onClick={() => handleUnbanUser(user.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {t('actions.unban')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBanUser(user.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {t('actions.ban')}
                          </DropdownMenuItem>
                        )}

                        {/* Delete */}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedUser(user)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('actions.delete')}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tCommon('page', { current: page + 1, total: totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              {tCommon('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="font-medium">{selectedUser.name || t('noName')}</p>
              <p className="text-sm text-muted-foreground">
                {selectedUser.email}
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
            <Button variant="destructive" onClick={handleDeleteUser}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resetPasswordDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('resetPasswordDialog.description', {
                email: selectedUser?.email ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('resetPasswordDialog.newPassword')}
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t('createUser.passwordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialogOpen(false)
                setNewPassword('')
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              {t('resetPasswordDialog.title')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('editDialog.description', {
                email: selectedUser?.email ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">{t('editDialog.name')}</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('createUser.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">{t('editDialog.email')}</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder={t('createUser.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">{t('editDialog.phone')}</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">{t('editDialog.role')}</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as 'user' | 'admin')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('editDialog.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('roles.user')}</SelectItem>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStripeCustomerId">
                {t('editDialog.stripeId')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="editStripeCustomerId"
                  value={editStripeCustomerId}
                  onChange={(e) => setEditStripeCustomerId(e.target.value)}
                  placeholder={t('editDialog.stripeIdPlaceholder')}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditStripeCustomerId('')}
                  disabled={!editStripeCustomerId}
                >
                  {tCommon('clear')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('editDialog.clearStripe')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateUser}>{tCommon('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
