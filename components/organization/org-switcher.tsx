'use client'

import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Plus, Building2, Check, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
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
  const router = useRouter()
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations()
  const { data: activeOrg, isPending: activeLoading } =
    authClient.useActiveOrganization()

  const isLoading = orgsLoading || activeLoading

  async function handleSwitchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    router.refresh()
  }

  if (isLoading) {
    return (
      <SidebarMenuButton size="lg" className="animate-pulse">
        <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg">
          <Building2 className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">Loading...</span>
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
              {currentOrg?.name || 'Select Organization'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentOrg?.slug || 'No organization'}
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
          Organizations
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
            Create Organization
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
            Manage Organizations
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
