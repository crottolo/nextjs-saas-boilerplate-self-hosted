'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { RoleBadge } from './role-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Member {
  id: string
  role: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface MembersTableProps {
  members: Member[]
  currentUserId: string
  currentUserRole: string
  organizationId: string
  onUpdate: () => void
}

export function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  organizationId,
  onUpdate,
}: MembersTableProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [removeMemberEmail, setRemoveMemberEmail] = useState<string | null>(
    null
  )

  const canManageMembers =
    currentUserRole === 'owner' || currentUserRole === 'admin'
  const isOwner = currentUserRole === 'owner'

  async function handleUpdateRole(memberId: string, newRole: string) {
    setUpdating(memberId)
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setUpdating(null)
    }
  }

  async function handleRemoveMember() {
    if (!removeMemberEmail) return
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: removeMemberEmail,
        organizationId,
      })
      onUpdate()
      setRemoveMemberEmail(null)
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          {canManageMembers && <TableHead className="w-[50px]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isCurrentUser = member.user.id === currentUserId
          const isMemberOwner = member.role === 'owner'
          const canEdit = canManageMembers && !isCurrentUser && !isMemberOwner

          return (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.user.name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                {canEdit && isOwner ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      handleUpdateRole(member.id, value)
                    }
                    disabled={updating === member.id}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={member.role} />
                )}
              </TableCell>
              <TableCell>
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
              {canManageMembers && (
                <TableCell>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setRemoveMemberEmail(member.user.email)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>

      {/* Remove Member Dialog */}
      <AlertDialog
        open={!!removeMemberEmail}
        onOpenChange={(open) => !open && setRemoveMemberEmail(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeMemberEmail} from this
              organization?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  )
}
