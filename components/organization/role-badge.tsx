import { Badge } from '@/components/ui/badge'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    owner: 'destructive',
    admin: 'default',
    member: 'secondary',
  }

  return (
    <Badge variant={variants[role] || 'outline'} className="capitalize">
      {role}
    </Badge>
  )
}
