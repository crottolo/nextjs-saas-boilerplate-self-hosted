import { db } from './db'
import { activityLog } from './db/auth-schema'
import { nanoid } from 'nanoid'

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'profile_updated'
  | 'email_verified'
  | 'subscription_upgraded'
  | 'subscription_cancelled'
  | 'organization_created'
  | 'organization_joined'
  | 'member_invited'

interface LogActivityParams {
  userId: string
  action: ActivityAction
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function logActivity({
  userId,
  action,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams) {
  try {
    await db.insert(activityLog).values({
      id: nanoid(),
      userId,
      action,
      details,
      ipAddress,
      userAgent,
    })
  } catch (error) {
    console.error('[Activity] Failed to log activity:', error)
  }
}

export function getActivityLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    login: 'Signed in',
    logout: 'Signed out',
    password_change: 'Changed password',
    password_reset: 'Reset password',
    '2fa_enabled': 'Enabled two-factor authentication',
    '2fa_disabled': 'Disabled two-factor authentication',
    profile_updated: 'Updated profile',
    email_verified: 'Verified email address',
    subscription_upgraded: 'Upgraded subscription',
    subscription_cancelled: 'Cancelled subscription',
    organization_created: 'Created organization',
    organization_joined: 'Joined organization',
    member_invited: 'Invited team member',
  }
  return labels[action] || action
}
