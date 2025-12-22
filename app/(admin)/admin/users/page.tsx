"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const limit = 10

  useEffect(() => {
    loadUsers()
  }, [page, search])

  async function loadUsers() {
    setLoading(true)
    const { data } = await authClient.admin.listUsers({
      query: {
        limit,
        offset: page * limit,
        searchValue: search || undefined,
        searchField: "email",
        searchOperator: "contains",
      },
    })
    if (data) {
      setUsers(data.users)
      setTotal(data.total)
    }
    setLoading(false)
  }

  async function handleBanUser(userId: string) {
    if (!confirm("Are you sure you want to ban this user?")) return
    await authClient.admin.banUser({ userId })
    loadUsers()
  }

  async function handleUnbanUser(userId: string) {
    await authClient.admin.unbanUser({ userId })
    loadUsers()
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    const { error } = await authClient.admin.createUser({
      email,
      password,
      name,
    })

    if (error) {
      alert(error.message)
    } else {
      loadUsers()
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in your application
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  Create a new user account
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              {total} total users
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name || "No name"}</p>
                      {user.role === "admin" && (
                        <Badge>Admin</Badge>
                      )}
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.emailVerified && (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {user.banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBanUser(user.id)}
                      >
                        Ban
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No users found
                </p>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
