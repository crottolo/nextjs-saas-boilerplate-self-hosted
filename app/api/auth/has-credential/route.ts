import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const credentialAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        eq(account.providerId, 'credential')
      ),
    })

    return NextResponse.json({ hasCredential: !!credentialAccount })
  } catch (error) {
    console.error('[Has Credential] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check credential status' },
      { status: 500 }
    )
  }
}
