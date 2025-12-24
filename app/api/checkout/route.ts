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
    const { priceId, successUrl, cancelUrl } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Get user's Stripe customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    let customerId = dbUser?.stripeCustomerId

    // Verify customer exists in Stripe, create if not
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        // Customer doesn't exist in Stripe (different env or deleted)
        console.warn(`Customer ${customerId} not found in Stripe, creating new`)
        customerId = null
      }
    }

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Save to DB
      await db
        .update(user)
        .set({ stripeCustomerId: customerId })
        .where(eq(user.id, session.user.id))
    }

    // Check if user already has an active subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (existingSubs.data.length > 0) {
      // User has active subscription - redirect to billing portal for plan change
      const existingSub = existingSubs.data[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subAny = existingSub as any

      // Check if user is already on the same price
      const currentPriceId = subAny.items.data[0]?.price?.id
      if (currentPriceId === priceId) {
        return NextResponse.json(
          { error: 'You are already on this plan' },
          { status: 400 }
        )
      }

      const returnUrl =
        successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?updated=true`

      try {
        // Try with flow_data for direct plan change
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
          flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: {
              subscription: subAny.id,
              items: [{ id: subAny.items.data[0].id, price: priceId }],
            },
            after_completion: {
              type: 'redirect',
              redirect: {
                return_url: returnUrl,
              },
            },
          },
        })
        return NextResponse.json({ url: portalSession.url, type: 'portal' })
      } catch (flowError) {
        // Fallback: redirect to billing portal without flow_data
        // This happens when the price is not configured in the portal
        console.warn(
          'Flow data failed, falling back to standard portal:',
          flowError
        )
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        })
        return NextResponse.json({
          url: portalSession.url,
          type: 'portal',
          note: 'Please select your new plan from the portal',
        })
      }
    }

    // Create checkout session for new subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?upgraded=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url, type: 'checkout' })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
