import { db } from './db'
import { notification, user } from './db/auth-schema'
import { nanoid } from 'nanoid'
import { ne } from 'drizzle-orm'
import type { LocalizedField } from './db/localized'

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'system'
  | 'invite'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: LocalizedField
  message?: LocalizedField
  link?: string
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    await db.insert(notification).values({
      id: nanoid(),
      userId,
      type,
      title,
      message,
      link,
    })
    return { success: true }
  } catch (error) {
    console.error('[Notifications] Failed to create notification:', error)
    return { success: false, error }
  }
}

interface BulkNotificationParams {
  userIds: string[]
  type: NotificationType
  title: LocalizedField
  message?: LocalizedField
  link?: string
}

export async function createBulkNotifications({
  userIds,
  type,
  title,
  message,
  link,
}: BulkNotificationParams) {
  if (userIds.length === 0) return { success: true, count: 0 }

  try {
    const notifications = userIds.map((userId) => ({
      id: nanoid(),
      userId,
      type,
      title,
      message,
      link,
    }))

    await db.insert(notification).values(notifications)
    return { success: true, count: userIds.length }
  } catch (error) {
    console.error('[Notifications] Failed to create bulk notifications:', error)
    return { success: false, error }
  }
}

interface NotifyAllUsersParams {
  type: NotificationType
  title: LocalizedField
  message?: LocalizedField
  link?: string
  excludeUserId?: string
}

export async function notifyAllUsers({
  type,
  title,
  message,
  link,
  excludeUserId,
}: NotifyAllUsersParams) {
  try {
    const users = excludeUserId
      ? await db
          .select({ id: user.id })
          .from(user)
          .where(ne(user.id, excludeUserId))
      : await db.select({ id: user.id }).from(user)

    if (users.length === 0) return { success: true, count: 0 }

    const notifications = users.map((u) => ({
      id: nanoid(),
      userId: u.id,
      type,
      title,
      message,
      link,
    }))

    await db.insert(notification).values(notifications)
    return { success: true, count: users.length }
  } catch (error) {
    console.error('[Notifications] Failed to notify all users:', error)
    return { success: false, error }
  }
}
