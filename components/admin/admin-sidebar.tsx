'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  ShieldCheck,
  Users,
  Activity,
  Home,
  LogOut,
  ChevronsUpDown,
  Settings,
  Sun,
  Moon,
  Monitor,
  Building2,
  Bell,
  Package,
  Receipt,
  Layers,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { NavMain } from '@/components/dashboard/nav-main'
import { Link } from '@/i18n/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    role?: string
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const t = useTranslations('nav')
  const tAdmin = useTranslations('admin')
  const tCommon = useTranslations('common')
  const tTheme = useTranslations('theme')
  const tSidebar = useTranslations('sidebar')
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()

  const adminNavItems = [
    { title: tAdmin('overview'), url: '/admin', icon: ShieldCheck },
    { title: tAdmin('users.title'), url: '/admin/users', icon: Users },
    {
      title: tAdmin('organizations.title'),
      url: '/admin/organizations',
      icon: Building2,
    },
    {
      title: tAdmin('notifications.title'),
      url: '/admin/notifications',
      icon: Bell,
    },
    { title: tAdmin('sessions.title'), url: '/admin/sessions', icon: Activity },
    { title: tAdmin('settings.title'), url: '/admin/settings', icon: Settings },
  ]

  const stripeNavItems = [
    {
      title: tAdmin('plans.title'),
      url: '/admin/plans',
      icon: Layers,
    },
    {
      title: tAdmin('stripe.products.title'),
      url: '/admin/stripe/products',
      icon: Package,
    },
    {
      title: tAdmin('stripe.subscriptions.title'),
      url: '/admin/stripe/subscriptions',
      icon: Receipt,
    },
  ]

  const appNavItems = [{ title: t('backToApp'), url: '/dashboard', icon: Home }]

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'A'

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="bg-destructive text-destructive-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('admin')}</span>
                  <span className="truncate text-xs">{tCommon('appName')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminNavItems} label={tSidebar('administration')} />
        <SidebarSeparator />
        <NavMain items={stripeNavItems} label={tSidebar('stripe')} />
        <SidebarSeparator />
        <NavMain items={appNavItems} label={tSidebar('navigation')} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  {t('backToApp')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  {tTheme('light')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  {tTheme('dark')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  {tTheme('system')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
