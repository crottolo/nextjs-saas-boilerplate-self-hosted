'use client'

import { useTranslations } from 'next-intl'
import { ChevronsUpDown, Plus, Building2, Check, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@/i18n/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton } from '@/components/ui/sidebar'

export function OrgSwitcher() {
  const t = useTranslations('orgSwitcher')
  const router = useRouter()
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations()
  const { data: activeOrg, isPending: activeLoading } =
    authClient.useActiveOrganization()

  const isLoading = orgsLoading || activeLoading

  async function handleSwitchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    window.location.reload()
  }

  if (isLoading) {
    return (
      <SidebarMenuButton size="lg" className="animate-pulse">
        <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg">
          <Building2 className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{t('loading')}</span>
        </div>
      </SidebarMenuButton>
    )
  }

  const currentOrg = activeOrg || organizations?.[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {currentOrg?.name || t('select')}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentOrg?.slug || t('noOrg')}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('organizations')}
        </DropdownMenuLabel>
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrg(org.id)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <Building2 className="size-4 shrink-0" />
            </div>
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrg?.id === org.id && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/organizations/create')}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-background">
            <Plus className="size-4" />
          </div>
          <span className="font-medium text-muted-foreground">
            {t('create')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/organizations')}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-background">
            <Settings className="size-4" />
          </div>
          <span className="font-medium text-muted-foreground">
            {t('manage')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
