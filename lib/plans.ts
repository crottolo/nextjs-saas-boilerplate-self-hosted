import { db } from '@/lib/db'
import { plans, member, subscription } from '@/lib/db/auth-schema'
import { eq, and, count } from 'drizzle-orm'
import type { LocalizedField } from '@/lib/db/localized'

export interface Plan {
  id: string
  name: LocalizedField
  description: LocalizedField | null
  price: number
  credits: number
  maxOrganizations: number
  sortOrder: number
  isDefault: boolean | null
}

/**
 * Get the default (free) plan
 */
export async function getDefaultPlan(): Promise<Plan | null> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.isDefault, true))
    .limit(1)

  return plan || null
}

/**
 * Get a plan by ID
 */
export async function getPlanById(planId: string): Promise<Plan | null> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1)

  return plan || null
}

/**
 * Get the current plan for a user.
 * Returns the plan from their active subscription, or the default plan if none.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  // Get active subscription
  const [userSub] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.referenceId, userId),
        eq(subscription.status, 'active')
      )
    )
    .limit(1)

  if (userSub?.plan) {
    const plan = await getPlanById(userSub.plan)
    if (plan) return plan
  }

  // Fallback to default plan
  const defaultPlan = await getDefaultPlan()
  if (!defaultPlan) {
    // Ultimate fallback if no default plan exists
    return {
      id: 'free',
      name: { en: 'Free' },
      description: null,
      price: 0,
      credits: 100,
      maxOrganizations: 1,
      sortOrder: 0,
      isDefault: true,
    }
  }

  return defaultPlan
}

/**
 * Count organizations where user is owner
 */
export async function getOwnedOrganizationsCount(
  userId: string
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.role, 'owner')))

  return result[0]?.count ?? 0
}

/**
 * Check if user can create a new organization based on their plan limits
 */
export async function canCreateOrganization(userId: string): Promise<{
  allowed: boolean
  current: number
  max: number
}> {
  const [userPlan, ownedCount] = await Promise.all([
    getUserPlan(userId),
    getOwnedOrganizationsCount(userId),
  ])

  const max = userPlan.maxOrganizations

  // -1 means unlimited
  if (max === -1) {
    return { allowed: true, current: ownedCount, max: -1 }
  }

  return {
    allowed: ownedCount < max,
    current: ownedCount,
    max,
  }
}

/**
 * Check if user can downgrade to a target plan
 * Downgrade is blocked if current org count exceeds target plan limit
 */
export async function canDowngradeToPlan(
  userId: string,
  targetPlanId: string
): Promise<{
  allowed: boolean
  reason?: string
  current: number
  targetMax: number
}> {
  const [targetPlan, ownedCount] = await Promise.all([
    getPlanById(targetPlanId),
    getOwnedOrganizationsCount(userId),
  ])

  if (!targetPlan) {
    return {
      allowed: false,
      reason: 'Plan not found',
      current: ownedCount,
      targetMax: 0,
    }
  }

  const targetMax = targetPlan.maxOrganizations

  // -1 means unlimited, always allowed
  if (targetMax === -1) {
    return { allowed: true, current: ownedCount, targetMax: -1 }
  }

  if (ownedCount > targetMax) {
    return {
      allowed: false,
      reason: `You have ${ownedCount} organizations but this plan only allows ${targetMax}. Please delete ${ownedCount - targetMax} organization(s) before downgrading.`,
      current: ownedCount,
      targetMax,
    }
  }

  return { allowed: true, current: ownedCount, targetMax }
}

/**
 * Get remaining credits for a user (placeholder for future implementation)
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  const plan = await getUserPlan(userId)
  // TODO: Implement credit usage tracking
  // For now, return the plan's credit limit
  return plan.credits
}
