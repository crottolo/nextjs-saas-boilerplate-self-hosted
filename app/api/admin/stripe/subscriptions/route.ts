import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    // Get subscriptions directly from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status:
        status === 'all'
          ? undefined
          : (status as Stripe.SubscriptionListParams['status']) || undefined,
      expand: ['data.customer'],
    })

    // Map subscriptions with user info from DB
    const subscriptions = await Promise.all(
      stripeSubscriptions.data.map(async (sub) => {
        const customer = sub.customer as Stripe.Customer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny = sub as any

        // Try to find user by stripeCustomerId
        let dbUser = null
        if (customer?.id) {
          const [foundUser] = await db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .where(eq(user.stripeCustomerId, customer.id))
            .limit(1)
          dbUser = foundUser
        }

        return {
          id: sub.id,
          plan:
            subAny.items?.data?.[0]?.price?.nickname ||
            subAny.items?.data?.[0]?.price?.id ||
            'Unknown',
          status: sub.status,
          stripeCustomerId: customer?.id || null,
          stripeSubscriptionId: sub.id,
          periodStart: subAny.current_period_start
            ? new Date(subAny.current_period_start * 1000).toISOString()
            : null,
          periodEnd: subAny.current_period_end
            ? new Date(subAny.current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: subAny.cancel_at_period_end ?? false,
          trialStart: subAny.trial_start
            ? new Date(subAny.trial_start * 1000).toISOString()
            : null,
          trialEnd: subAny.trial_end
            ? new Date(subAny.trial_end * 1000).toISOString()
            : null,
          createdAt: new Date(subAny.created * 1000).toISOString(),
          userName: dbUser?.name || customer?.name || null,
          userEmail: dbUser?.email || customer?.email || null,
          userId: dbUser?.id || null,
        }
      })
    )

    // Filter by search if provided
    let filtered = subscriptions
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.userName?.toLowerCase().includes(searchLower) ||
          s.userEmail?.toLowerCase().includes(searchLower) ||
          s.plan?.toLowerCase().includes(searchLower)
      )
    }

    // Get stats from all subscriptions (before search filter)
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'active').length,
      trialing: subscriptions.filter((s) => s.status === 'trialing').length,
      canceled: subscriptions.filter((s) => s.status === 'canceled').length,
      pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
    }

    return NextResponse.json({
      subscriptions: filtered,
      stats,
    })
  } catch (error) {
    console.error('List subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to list subscriptions' },
      { status: 500 }
    )
  }
}
