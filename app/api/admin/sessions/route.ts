import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { session, user } from '@/lib/db/auth-schema'
import { eq, gt } from 'drizzle-orm'

export async function GET() {
  try {
    // Verify admin session
    const sessionData = await auth.api.getSession({
      headers: await headers(),
    })

    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (sessionData.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all active sessions with user data
    const sessions = await db
      .select({
        id: session.id,
        token: session.token,
        userId: session.userId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        user: {
          email: user.email,
          name: user.name,
        },
      })
      .from(session)
      .leftJoin(user, eq(session.userId, user.id))
      .where(gt(session.expiresAt, new Date()))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
