import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Pass the request headers to authenticate the user
    await auth.api.setPassword({
      body: { newPassword },
      headers: request.headers,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Set Password] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to set password',
      },
      { status: 500 }
    )
  }
}
