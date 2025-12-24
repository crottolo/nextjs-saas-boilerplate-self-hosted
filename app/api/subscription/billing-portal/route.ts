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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { returnUrl } = await request.json()

    // Get user's Stripe customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found', redirect: '/pricing' },
        { status: 404 }
      )
    }

    // Helper to clear invalid customer
    const clearCustomerAndRedirect = async () => {
      console.warn(
        `Customer ${dbUser.stripeCustomerId} invalid in Stripe, clearing`
      )
      await db
        .update(user)
        .set({ stripeCustomerId: null })
        .where(eq(user.id, session.user.id))

      return NextResponse.json(
        { error: 'No subscription found', redirect: '/pricing' },
        { status: 404 }
      )
    }

    // Verify customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId)
      // Check if customer was deleted
      if ('deleted' in customer && customer.deleted) {
        return clearCustomerAndRedirect()
      }
    } catch {
      return clearCustomerAndRedirect()
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    // Handle Stripe errors for invalid customer
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code === 'resource_missing'
    ) {
      console.warn('Stripe customer not found, clearing from DB')
      await db
        .update(user)
        .set({ stripeCustomerId: null })
        .where(eq(user.id, session.user.id))

      return NextResponse.json(
        { error: 'No subscription found', redirect: '/pricing' },
        { status: 404 }
      )
    }

    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
