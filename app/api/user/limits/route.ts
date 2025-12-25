import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserPlan, getOwnedOrganizationsCount } from '@/lib/plans'
import { getLocalized } from '@/lib/db/localized'

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [plan, ownedOrgsCount] = await Promise.all([
      getUserPlan(session.user.id),
      getOwnedOrganizationsCount(session.user.id),
    ])

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: getLocalized(plan.name, 'en'),
        credits: plan.credits,
        maxOrganizations: plan.maxOrganizations,
      },
      usage: {
        organizationsOwned: ownedOrgsCount,
      },
      canCreateOrganization:
        plan.maxOrganizations === -1 || ownedOrgsCount < plan.maxOrganizations,
    })
  } catch (error) {
    console.error('Get user limits error:', error)
    return NextResponse.json({ error: 'Failed to get limits' }, { status: 500 })
  }
}
