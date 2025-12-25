import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { plans, stripeProduct } from '@/lib/db/auth-schema'
import { eq, asc, sql } from 'drizzle-orm'
import type { LocalizedField } from '@/lib/db/localized'

// GET: List all plans with linked products count
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const allPlans = await db
      .select({
        id: plans.id,
        name: plans.name,
        description: plans.description,
        price: plans.price,
        credits: plans.credits,
        maxOrganizations: plans.maxOrganizations,
        sortOrder: plans.sortOrder,
        isDefault: plans.isDefault,
        createdAt: plans.createdAt,
        linkedProductsCount: sql<number>`(
          SELECT COUNT(*) FROM stripe_product
          WHERE stripe_product.plan_id = ${plans.id}
        )`.as('linked_products_count'),
      })
      .from(plans)
      .orderBy(asc(plans.sortOrder))

    return NextResponse.json({ plans: allPlans })
  } catch (error) {
    console.error('Fetch plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

// POST: Create a new plan
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      price,
      credits,
      maxOrganizations,
      sortOrder,
      isDefault,
    } = body as {
      id: string
      name: LocalizedField
      description?: LocalizedField
      price: number
      credits: number
      maxOrganizations: number
      sortOrder: number
      isDefault?: boolean
    }

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      )
    }

    // If this is the default plan, unset other defaults
    if (isDefault) {
      await db.update(plans).set({ isDefault: false })
    }

    await db.insert(plans).values({
      id,
      name,
      description: description || null,
      price: price || 0,
      credits: credits || 0,
      maxOrganizations: maxOrganizations ?? 1,
      sortOrder: sortOrder || 0,
      isDefault: isDefault || false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}

// PUT: Update an existing plan
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      price,
      credits,
      maxOrganizations,
      sortOrder,
      isDefault,
    } = body as {
      id: string
      name: LocalizedField
      description?: LocalizedField
      price: number
      credits: number
      maxOrganizations: number
      sortOrder: number
      isDefault?: boolean
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // If this is the default plan, unset other defaults
    if (isDefault) {
      await db.update(plans).set({ isDefault: false })
    }

    await db
      .update(plans)
      .set({
        name,
        description: description || null,
        price: price || 0,
        credits: credits || 0,
        maxOrganizations: maxOrganizations ?? 1,
        sortOrder: sortOrder || 0,
        isDefault: isDefault || false,
      })
      .where(eq(plans.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a plan (only if no linked products)
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Check if plan has linked products
    const linkedProducts = await db
      .select()
      .from(stripeProduct)
      .where(eq(stripeProduct.planId, id))
      .limit(1)

    if (linkedProducts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with linked Stripe products' },
        { status: 400 }
      )
    }

    await db.delete(plans).where(eq(plans.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
