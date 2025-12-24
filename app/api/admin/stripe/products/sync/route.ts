import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { stripeProduct } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { nanoid } from 'nanoid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active products from Stripe
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    })

    let imported = 0
    let skipped = 0

    for (const product of stripeProducts.data) {
      // Get the default price for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      })

      for (const price of prices.data) {
        // Check if already exists in DB
        const [existing] = await db
          .select()
          .from(stripeProduct)
          .where(eq(stripeProduct.stripePriceId, price.id))
          .limit(1)

        if (existing) {
          skipped++
          continue
        }

        // Import new product/price
        await db.insert(stripeProduct).values({
          id: nanoid(),
          stripeProductId: product.id,
          stripePriceId: price.id,
          name: product.name,
          description: product.description || null,
          price: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || null,
          features: JSON.stringify([]),
          limits: JSON.stringify({ projects: 3, storage: 1 }),
          trialDays: 0,
          enabled: false, // Admin must enable manually
          sortOrder: 0,
          popular: false,
        })

        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} products, skipped ${skipped} existing`,
    })
  } catch (error) {
    console.error('Sync products error:', error)
    return NextResponse.json(
      { error: 'Failed to sync products from Stripe' },
      { status: 500 }
    )
  }
}
