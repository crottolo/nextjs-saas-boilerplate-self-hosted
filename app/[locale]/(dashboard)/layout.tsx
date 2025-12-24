'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter as useNextRouter } from 'next/navigation'
import { Link, usePathname } from '@/i18n/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { LocaleSwitcher } from '@/components/locale-switcher'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations('nav')
  const tImpersonation = useTranslations('impersonation')
  const { data: session, isPending } = useSession()
  const { data: organizations } = authClient.useListOrganizations()
  const router = useNextRouter()
  const pathname = usePathname()

  // Translated path labels
  const pathLabels: Record<string, string> = {
    dashboard: t('dashboard'),
    profile: t('profile'),
    organizations: t('organizations'),
    create: 'Create',
    pricing: t('pricing'),
    billing: 'Billing',
    activity: t('activity'),
    help: t('help'),
  }

  // Generate breadcrumb items from pathname (already without locale from next-intl)
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    // Try to find org name if this segment is an org ID
    const orgName = organizations?.find((o) => o.id === segment)?.name
    const label =
      pathLabels[segment] ||
      orgName ||
      segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1
    return { path, label, isLast }
  })

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/')
    }
  }, [session, isPending, router])

  async function handleStopImpersonating() {
    await authClient.admin.stopImpersonating()
    router.push('/admin/users')
  }

  const isImpersonating = !!(session?.session as { impersonatedBy?: string })
    ?.impersonatedBy

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name || 'User',
          email: session.user.email,
          role: session.user.role ?? undefined,
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.path} className="contents">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <LocaleSwitcher />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isImpersonating && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <Eye className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-200">
                  {tImpersonation('message')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopImpersonating}
                  className="ml-4"
                >
                  {tImpersonation('stop')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
