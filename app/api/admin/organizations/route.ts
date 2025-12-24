import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { member, organization } from '@/lib/db/auth-schema'
import { eq, sql, desc } from 'drizzle-orm'

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

    // Get all organizations with member count
    const orgs = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        createdAt: organization.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*) FROM member
          WHERE member.organization_id = ${organization.id}
        )`,
      })
      .from(organization)
      .orderBy(desc(organization.createdAt))

    // Filter by search if provided
    const filtered = search
      ? orgs.filter(
          (org) =>
            org.name.toLowerCase().includes(search.toLowerCase()) ||
            org.slug.toLowerCase().includes(search.toLowerCase())
        )
      : orgs

    return NextResponse.json({
      organizations: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('List organizations error:', error)
    return NextResponse.json(
      { error: 'Failed to list organizations' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId required' },
        { status: 400 }
      )
    }

    // Check member count
    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(member)
      .where(eq(member.organizationId, organizationId))

    await db.delete(organization).where(eq(organization.id, organizationId))

    return NextResponse.json({
      success: true,
      membersRemoved: memberCount[0]?.count || 0,
    })
  } catch (error) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    )
  }
}
