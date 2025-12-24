import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { activityLog } from '@/lib/db/auth-schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const logs = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, session.user.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ logs })
}
