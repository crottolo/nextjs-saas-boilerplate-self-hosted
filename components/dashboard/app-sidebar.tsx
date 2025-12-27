'use client'

import {
  Home,
  Building2,
  User,
  CreditCard,
  HelpCircle,
  Activity,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import { OrgSwitcher } from '@/components/organization/org-switcher'

interface AppSidebarProps {
  user: {
    name: string
    email: string
    role?: string
    image?: string | null
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { setTheme } = useTheme()
  const t = useTranslations('nav')
  const tTheme = useTranslations('theme')
  const tSidebar = useTranslations('sidebar')

  const mainNavItems = [
    {
      title: t('dashboard'),
      url: '/dashboard',
      icon: Home,
    },
    {
      title: t('organizations'),
      url: '/organizations',
      icon: Building2,
    },
    {
      title: t('profile'),
      url: '/profile',
      icon: User,
    },
    {
      title: t('pricing'),
      url: '/pricing',
      icon: CreditCard,
    },
    {
      title: t('activity'),
      url: '/activity',
      icon: Activity,
    },
    {
      title: t('help'),
      url: '/help',
      icon: HelpCircle,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild></DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
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
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} label={tSidebar('platform')} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
