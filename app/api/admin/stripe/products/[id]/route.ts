import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { stripeProduct } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const [product] = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.id, id))
      .limit(1)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Failed to get product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const [existing] = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update Stripe product if name or description changed
    if (body.name || body.description !== undefined) {
      await stripe.products.update(existing.stripeProductId, {
        name: body.name || existing.name,
        description: body.description ?? existing.description ?? undefined,
      })
    }

    // Update DB
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.features !== undefined)
      updateData.features = JSON.stringify(body.features)
    if (body.limits !== undefined)
      updateData.limits = JSON.stringify(body.limits)
    if (body.trialDays !== undefined) updateData.trialDays = body.trialDays
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.popular !== undefined) updateData.popular = body.popular

    if (Object.keys(updateData).length > 0) {
      await db
        .update(stripeProduct)
        .set(updateData)
        .where(eq(stripeProduct.id, id))
    }

    const [updated] = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.id, id))
      .limit(1)

    return NextResponse.json({ product: updated })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    const [existing] = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let action = 'archived'

    if (forceDelete) {
      // Try to delete completely from Stripe (only works if never used)
      try {
        await stripe.products.del(existing.stripeProductId)
        action = 'deleted'
      } catch (stripeError: unknown) {
        // If delete fails (product has been used), archive instead
        const error = stripeError as { code?: string }
        if (error.code === 'resource_missing') {
          // Product already deleted from Stripe, just remove from DB
          action = 'deleted'
        } else {
          // Product has subscriptions, archive it
          await stripe.products.update(existing.stripeProductId, {
            active: false,
          })
          action = 'archived'
        }
      }
    } else {
      // Just archive (deactivate) in Stripe
      await stripe.products.update(existing.stripeProductId, {
        active: false,
      })
    }

    // Delete from DB
    await db.delete(stripeProduct).where(eq(stripeProduct.id, id))

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
