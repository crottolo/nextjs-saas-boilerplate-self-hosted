"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const adminNavigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Sessions", href: "/admin/sessions" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login")
    }
    // Check if user is admin
    if (!isPending && session && session.user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || session.user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-bold text-xl">AuthApp</span>
              <Badge variant="secondary">Admin</Badge>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}
