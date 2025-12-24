import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stripeProduct } from '@/lib/db/auth-schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const products = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.enabled, true))
      .orderBy(asc(stripeProduct.sortOrder))

    // Transform for frontend
    const plans = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      interval: p.interval,
      priceId: p.stripePriceId,
      features: p.features ? JSON.parse(p.features) : [],
      limits: p.limits ? JSON.parse(p.limits) : {},
      trialDays: p.trialDays,
      popular: p.popular,
    }))

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}
