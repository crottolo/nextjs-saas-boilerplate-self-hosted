import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user, notification } from '@/lib/db/auth-schema'
import { desc, sql } from 'drizzle-orm'
import {
  createNotification,
  createBulkNotifications,
  notifyAllUsers,
  NotificationType,
} from '@/lib/notifications'
import type { LocalizedField } from '@/lib/db/localized'

// GET: List users for selection
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)

    const filtered = search
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.name?.toLowerCase().includes(search.toLowerCase())
        )
      : users

    // Get recent notifications with recipient info
    const notifications = await db
      .select({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt,
        recipientName: sql<string | null>`(
          SELECT "user".name FROM "user"
          WHERE "user".id = ${notification.userId}
        )`,
        recipientEmail: sql<string>`(
          SELECT "user".email FROM "user"
          WHERE "user".id = ${notification.userId}
        )`,
      })
      .from(notification)
      .orderBy(desc(notification.createdAt))
      .limit(100)

    return NextResponse.json({ users: filtered, notifications })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}

// POST: Send notification
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, title, message, link, target, userIds } = body as {
      type: NotificationType
      title: LocalizedField
      message?: LocalizedField
      link?: string
      target: 'all' | 'selected'
      userIds?: string[]
    }

    if (!type || !title || Object.keys(title).length === 0) {
      return NextResponse.json(
        { error: 'type and title are required' },
        { status: 400 }
      )
    }

    let result

    if (target === 'all') {
      result = await notifyAllUsers({
        type,
        title,
        message,
        link,
        excludeUserId: session.user.id,
      })
    } else if (userIds && userIds.length > 0) {
      if (userIds.length === 1) {
        result = await createNotification({
          userId: userIds[0],
          type,
          title,
          message,
          link,
        })
        result = { ...result, count: 1 }
      } else {
        result = await createBulkNotifications({
          userIds,
          type,
          title,
          message,
          link,
        })
      }
    } else {
      return NextResponse.json(
        { error: 'No recipients specified' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
