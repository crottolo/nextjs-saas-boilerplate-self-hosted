import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/auth-schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')
  const unreadOnly = searchParams.get('unread') === 'true'

  const query = db
    .select()
    .from(notification)
    .where(
      unreadOnly
        ? and(
            eq(notification.userId, session.user.id),
            eq(notification.read, false)
          )
        : eq(notification.userId, session.user.id)
    )
    .orderBy(desc(notification.createdAt))
    .limit(limit)

  const notifications = await query

  const unreadCount = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, session.user.id),
        eq(notification.read, false)
      )
    )
    .then((rows) => rows.length)

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, markAllAsRead } = body

  if (markAllAsRead) {
    await db
      .update(notification)
      .set({ read: true })
      .where(eq(notification.userId, session.user.id))
  } else if (id) {
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(eq(notification.id, id), eq(notification.userId, session.user.id))
      )
  }

  return NextResponse.json({ success: true })
}
