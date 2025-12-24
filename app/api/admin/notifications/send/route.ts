import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/auth-schema'
import {
  createNotification,
  createBulkNotifications,
  notifyAllUsers,
  NotificationType,
} from '@/lib/notifications'

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

    return NextResponse.json({ users: filtered })
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
      title: string
      message?: string
      link?: string
      target: 'all' | 'selected'
      userIds?: string[]
    }

    if (!type || !title) {
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
