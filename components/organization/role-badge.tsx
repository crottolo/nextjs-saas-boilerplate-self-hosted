'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useTranslations('roles')
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    owner: 'destructive',
    admin: 'default',
    member: 'secondary',
  }

  const roleLabel = t.has(role) ? t(role as 'owner' | 'admin' | 'member') : role

  return (
    <Badge variant={variants[role] || 'outline'} className="capitalize">
      {roleLabel}
    </Badge>
  )
}
