import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscriptions = await db
      .select()
      .from(subscription)
      .where(eq(subscription.referenceId, session.user.id))

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('List subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to list subscriptions' },
      { status: 500 }
    )
  }
}
