import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stripeProduct } from '@/lib/db/auth-schema'
import { eq, asc } from 'drizzle-orm'
import { getLocalized, getLocalizedArray } from '@/lib/db/localized'

export async function GET(request: NextRequest) {
  try {
    // Get locale from Accept-Language header or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || 'en'
    const locale = acceptLanguage.split(',')[0].split('-')[0] || 'en'

    const products = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.enabled, true))
      .orderBy(asc(stripeProduct.sortOrder))

    // Transform for frontend with localized content
    const plans = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: getLocalized(p.description, locale),
      price: p.price,
      currency: p.currency,
      interval: p.interval,
      priceId: p.stripePriceId,
      features: getLocalizedArray(p.features, locale),
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
