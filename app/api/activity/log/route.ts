import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { logActivity, ActivityAction } from '@/lib/activity'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, details } = await request.json()

    // Validate action
    const validActions: ActivityAction[] = [
      'login',
      'logout',
      'password_change',
      'password_reset',
      '2fa_enabled',
      '2fa_disabled',
      'profile_updated',
      'email_verified',
      'subscription_upgraded',
      'subscription_cancelled',
      'organization_created',
      'organization_joined',
      'member_invited',
    ]

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get IP and User Agent from request
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      undefined
    const userAgent = headersList.get('user-agent') || undefined

    await logActivity({
      userId: session.user.id,
      action,
      details,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log activity error:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
