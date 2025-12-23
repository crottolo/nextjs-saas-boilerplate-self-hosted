import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, session } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const sessionData = await auth.api.getSession({ headers: await headers() })

  if (!sessionData || sessionData.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { newEmail } = body

  if (!newEmail || typeof newEmail !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Verifica email non già in uso
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, newEmail))
    .limit(1)

  if (existingUser.length > 0) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  }

  // Aggiorna email admin direttamente
  await db
    .update(user)
    .set({ email: newEmail, updatedAt: new Date() })
    .where(eq(user.id, sessionData.user.id))

  // Revoca tutte le sessioni dell'admin (forza re-login)
  await db.delete(session).where(eq(session.userId, sessionData.user.id))

  return NextResponse.json({ success: true, requiresLogin: true })
}
