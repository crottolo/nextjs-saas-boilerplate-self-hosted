import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stripeProduct, plans } from '@/lib/db/auth-schema'
import { eq, asc, isNotNull } from 'drizzle-orm'
import { getLocalized, getLocalizedArray } from '@/lib/db/localized'

export async function GET(request: NextRequest) {
  try {
    // Get locale from Accept-Language header or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || 'en'
    const locale = acceptLanguage.split(',')[0].split('-')[0] || 'en'

    // Get all plans with their Stripe products
    const allPlans = await db.select().from(plans).orderBy(asc(plans.sortOrder))

    const products = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.enabled, true))
      .orderBy(asc(stripeProduct.sortOrder))

    // Group products by planId
    const productsByPlan = new Map<string, typeof products>()
    for (const product of products) {
      if (product.planId) {
        const existing = productsByPlan.get(product.planId) || []
        existing.push(product)
        productsByPlan.set(product.planId, existing)
      }
    }

    // Build response: plans with their prices
    const plansWithPrices = allPlans
      .filter((plan) => {
        // Include plan only if it has enabled products OR is the default (free) plan
        return productsByPlan.has(plan.id) || plan.isDefault
      })
      .map((plan) => {
        const planProducts = productsByPlan.get(plan.id) || []

        // Get features and description from first product (they should be same for all variants)
        const firstProduct = planProducts[0]

        return {
          id: plan.id,
          name: getLocalized(plan.name, locale),
          description: plan.description
            ? getLocalized(plan.description, locale)
            : firstProduct
              ? getLocalized(firstProduct.description, locale)
              : null,
          credits: plan.credits,
          maxOrganizations: plan.maxOrganizations,
          isDefault: plan.isDefault,
          features: firstProduct
            ? getLocalizedArray(firstProduct.features, locale)
            : [],
          popular: planProducts.some((p) => p.popular),
          prices: planProducts.map((p) => ({
            id: p.stripePriceId,
            productId: p.id,
            price: p.price,
            currency: p.currency,
            interval: p.interval,
            trialDays: p.trialDays,
          })),
        }
      })

    return NextResponse.json({ plans: plansWithPrices })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}
