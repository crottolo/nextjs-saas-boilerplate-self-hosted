import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { member, organization } from '@/lib/db/auth-schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Find organizations where this user is a member
    const userOrgs = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))

    // Check each org to see if user is the only member
    const orgsToDelete: string[] = []
    for (const { organizationId } of userOrgs) {
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(member)
        .where(eq(member.organizationId, organizationId))

      if (memberCount[0]?.count === 1) {
        orgsToDelete.push(organizationId)
      }
    }

    // Delete orphaned organizations
    for (const orgId of orgsToDelete) {
      await db.delete(organization).where(eq(organization.id, orgId))
    }

    // Delete the user via Better Auth admin API
    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    })

    return NextResponse.json({
      success: true,
      deletedOrganizations: orgsToDelete.length,
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
