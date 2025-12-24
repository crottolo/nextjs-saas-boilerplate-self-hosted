'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
}

export default function AdminUsersPage() {
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
      toast.success('User banned')
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleUnbanUser(userId: string) {
    const { error } = await authClient.admin.unbanUser({ userId })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('User unbanned')
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
        toast.error(data.error || 'Failed to delete user')
      } else {
        const orgMsg =
          data.deletedOrganizations > 0
            ? ` (${data.deletedOrganizations} orphaned org deleted)`
            : ''
        toast.success(`User deleted${orgMsg}`)
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('Failed to delete user')
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
      toast.success('User created successfully!')
      setCreateDialogOpen(false)
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleSetRole(userId: string, role: 'user' | 'admin') {
    const { error } = await authClient.admin.setRole({ userId, role })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Role updated to ${role}`)
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    const { error } = await authClient.admin.setUserPassword({
      userId: selectedUser.id,
      newPassword,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset successfully')
      setResetPasswordDialogOpen(false)
      setNewPassword('')
      setSelectedUser(null)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return

    // Update user data (name, email, phone)
    const { error: updateError } = await authClient.admin.updateUser({
      userId: selectedUser.id,
      data: {
        name: editName || undefined,
        email: editEmail || undefined,
        phoneNumber: editPhone || undefined,
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

    toast.success('User updated successfully')
    setEditDialogOpen(false)
    setSelectedUser(null)
    setRefreshKey((k) => k + 1)
  }

  async function handleImpersonate(userId: string) {
    const { error } = await authClient.admin.impersonateUser({ userId })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Impersonating user...')
      router.push('/dashboard')
    }
  }

  function openEditDialog(user: UserType) {
    setSelectedUser(user)
    setEditName(user.name || '')
    setEditEmail(user.email)
    setEditPhone(user.phoneNumber || '')
    setEditRole((user.role as 'user' | 'admin') || 'user')
    setEditDialogOpen(true)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in your application ({total} total)
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  Create a new user account manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 8 characters"
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
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || 'No name'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.emailVerified ? (
                        <Badge variant="secondary">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge>Admin</Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Edit User */}
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit User
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
                          Reset Password
                        </DropdownMenuItem>

                        {/* Set Role */}
                        {user.role === 'admin' ? (
                          <DropdownMenuItem
                            onClick={() => handleSetRole(user.id, 'user')}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Make User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleSetRole(user.id, 'admin')}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Impersonate */}
                        <DropdownMenuItem
                          onClick={() => handleImpersonate(user.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>

                        {/* View Sessions */}
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/sessions?userId=${user.id}`)
                          }
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          View Sessions
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Ban/Unban */}
                        {user.banned ? (
                          <DropdownMenuItem
                            onClick={() => handleUnbanUser(user.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBanUser(user.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban User
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
                          Delete User
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
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="font-medium">{selectedUser.name || 'No name'}</p>
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
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
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
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Min 8 characters"
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
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as 'user' | 'admin')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
