import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { stripeProduct } from '@/lib/db/auth-schema'
import { desc, eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { nanoid } from 'nanoid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await db
      .select()
      .from(stripeProduct)
      .orderBy(desc(stripeProduct.sortOrder), desc(stripeProduct.createdAt))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('List products error:', error)
    return NextResponse.json(
      { error: 'Failed to list products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      currency = 'eur',
      interval = 'month',
      features = [],
      limits = { projects: 3, storage: 1 },
      trialDays = 0,
      enabled = false,
      sortOrder = 0,
      popular = false,
    } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'name and price are required' },
        { status: 400 }
      )
    }

    // Create product in Stripe
    const stripeProductObj = await stripe.products.create({
      name,
      description: description || undefined,
      active: true,
      metadata: {
        source: 'admin-panel',
      },
    })

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProductObj.id,
      unit_amount: price,
      currency,
      recurring: interval
        ? { interval: interval as 'month' | 'year' }
        : undefined,
      metadata: {
        source: 'admin-panel',
      },
    })

    // Save to DB
    const id = nanoid()
    await db.insert(stripeProduct).values({
      id,
      stripeProductId: stripeProductObj.id,
      stripePriceId: stripePrice.id,
      name,
      description,
      price,
      currency,
      interval,
      features: JSON.stringify(features),
      limits: JSON.stringify(limits),
      trialDays,
      enabled,
      sortOrder,
      popular,
    })

    const [created] = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.id, id))
      .limit(1)

    return NextResponse.json({ product: created }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
