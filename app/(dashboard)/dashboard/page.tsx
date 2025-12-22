"use client"

import { useSession } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.name || "User"}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{session?.user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{session?.user.name || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">2FA</dt>
                <dd className="font-medium">
                  {session?.user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Current session details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Session ID</dt>
                <dd className="font-medium font-mono text-xs truncate">
                  {session?.session.id}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {session?.session.createdAt
                    ? new Date(session.session.createdAt).toLocaleDateString()
                    : "Unknown"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/settings"
              className="block text-sm text-primary hover:underline"
            >
              Update profile →
            </a>
            <a
              href="/settings/security"
              className="block text-sm text-primary hover:underline"
            >
              Security settings →
            </a>
            <a
              href="/organizations"
              className="block text-sm text-primary hover:underline"
            >
              Manage organizations →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
