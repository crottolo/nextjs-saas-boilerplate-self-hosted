import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { subscription, user, stripeProduct } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.created':
      case 'invoice.updated':
        // Log only, no action needed
        console.log(`[Stripe Webhook] Invoice event: ${event.type}`)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Processing checkout.session.completed')

  if (session.mode !== 'subscription') {
    console.log('[Stripe Webhook] Not a subscription checkout, skipping')
    return
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('[Stripe Webhook] No userId in session metadata')
    return
  }

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = stripeSubscription as any

  // Get plan name from price
  const priceId = subData.items.data[0]?.price?.id
  let planName = 'unknown'

  if (priceId) {
    // Try to find plan name from our DB
    const [product] = await db
      .select({ name: stripeProduct.name })
      .from(stripeProduct)
      .where(eq(stripeProduct.stripePriceId, priceId))
      .limit(1)

    if (product) {
      planName = product.name.toLowerCase()
    } else {
      // Fallback: use price nickname or ID
      const price = subData.items.data[0]?.price
      planName = price?.nickname || priceId
    }
  }

  // Create or update subscription in DB
  const subscriptionData = {
    id: subscriptionId,
    plan: planName,
    referenceId: userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: subData.status,
    periodStart: new Date(subData.current_period_start * 1000),
    periodEnd: new Date(subData.current_period_end * 1000),
    cancelAtPeriodEnd: subData.cancel_at_period_end,
    trialStart: subData.trial_start
      ? new Date(subData.trial_start * 1000)
      : null,
    trialEnd: subData.trial_end ? new Date(subData.trial_end * 1000) : null,
  }

  await db
    .insert(subscription)
    .values(subscriptionData)
    .onConflictDoUpdate({
      target: subscription.id,
      set: {
        status: subscriptionData.status,
        periodStart: subscriptionData.periodStart,
        periodEnd: subscriptionData.periodEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        updatedAt: new Date(),
      },
    })

  console.log(
    `[Stripe Webhook] Subscription created/updated: ${subscriptionId}`
  )
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processing subscription update')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any
  const customerId = subAny.customer as string

  // Find user by stripeCustomerId
  const [dbUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.stripeCustomerId, customerId))
    .limit(1)

  if (!dbUser) {
    console.error('[Stripe Webhook] No user found for customer:', customerId)
    return
  }

  // Get plan name from price
  const priceId = subAny.items.data[0]?.price?.id
  let planName = 'unknown'

  if (priceId) {
    const [product] = await db
      .select({ name: stripeProduct.name })
      .from(stripeProduct)
      .where(eq(stripeProduct.stripePriceId, priceId))
      .limit(1)

    if (product) {
      planName = product.name.toLowerCase()
    } else {
      const price = subAny.items.data[0]?.price
      planName = price?.nickname || priceId
    }
  }

  const subscriptionData = {
    id: subAny.id,
    plan: planName,
    referenceId: dbUser.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subAny.id,
    status: subAny.status,
    periodStart: new Date(subAny.current_period_start * 1000),
    periodEnd: new Date(subAny.current_period_end * 1000),
    cancelAtPeriodEnd: subAny.cancel_at_period_end,
    trialStart: subAny.trial_start ? new Date(subAny.trial_start * 1000) : null,
    trialEnd: subAny.trial_end ? new Date(subAny.trial_end * 1000) : null,
  }

  await db
    .insert(subscription)
    .values(subscriptionData)
    .onConflictDoUpdate({
      target: subscription.id,
      set: {
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        periodStart: subscriptionData.periodStart,
        periodEnd: subscriptionData.periodEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        trialStart: subscriptionData.trialStart,
        trialEnd: subscriptionData.trialEnd,
        updatedAt: new Date(),
      },
    })

  console.log(`[Stripe Webhook] Subscription updated: ${subAny.id}`)
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processing subscription deleted')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any

  await db
    .update(subscription)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subAny.id))

  console.log(`[Stripe Webhook] Subscription canceled: ${subAny.id}`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] Processing invoice.paid')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any
  const subscriptionId = invoiceAny.subscription as string
  if (!subscriptionId) return

  // Update subscription status to active if it was past_due
  await db
    .update(subscription)
    .set({
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId))

  console.log(
    `[Stripe Webhook] Invoice paid for subscription: ${subscriptionId}`
  )
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] Processing invoice.payment_failed')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any
  const subscriptionId = invoiceAny.subscription as string
  if (!subscriptionId) return

  await db
    .update(subscription)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId))

  console.log(
    `[Stripe Webhook] Payment failed for subscription: ${subscriptionId}`
  )
}
