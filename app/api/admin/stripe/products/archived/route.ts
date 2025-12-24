import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Stripe from 'stripe'

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
    // Fetch archived (inactive) products from Stripe
    const stripeProducts = await stripe.products.list({
      active: false,
      limit: 100,
      expand: ['data.default_price'],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = stripeProducts.data.map((p: any) => {
      const price = p.default_price as Stripe.Price | null
      return {
        id: p.id,
        stripeProductId: p.id,
        stripePriceId: price?.id || null,
        name: p.name,
        description: p.description,
        price: price?.unit_amount || 0,
        currency: price?.currency || 'eur',
        interval: price?.recurring?.interval || null,
        createdAt: new Date(p.created * 1000).toISOString(),
        archived: true,
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('List archived products error:', error)
    return NextResponse.json(
      { error: 'Failed to list archived products' },
      { status: 500 }
    )
  }
}
