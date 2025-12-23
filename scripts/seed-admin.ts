import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { user, account } from '../lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { scrypt } from '@noble/hashes/scrypt.js'
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js'

// Better Auth scrypt config
const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
}

// Hash password in Better Auth format: salt:key (hex)
// Better Auth passes salt as hex STRING to scrypt, not as bytes
async function hashPassword(password: string): Promise<string> {
  const saltBytes = randomBytes(16)
  const saltHex = bytesToHex(saltBytes)
  // Pass salt as hex string (like Better Auth does)
  const key = scrypt(password.normalize('NFKC'), saltHex, SCRYPT_CONFIG)
  return `${saltHex}:${bytesToHex(key)}`
}

// Configurazione
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123!'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator'

async function seedAdmin() {
  console.log('Connecting to database...')

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client)

  console.log('Checking if admin user exists...')

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1)

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0]
    console.log(`User ${ADMIN_EMAIL} already exists`)

    if (existingUser.role !== 'admin') {
      console.log('Updating role to admin...')
      await db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(user.id, existingUser.id))
      console.log('User role updated to admin')
    } else {
      console.log('User is already an admin')
    }
  } else {
    console.log('Creating new admin user...')

    // Hash password in Better Auth scrypt format
    const hashedPassword = await hashPassword(ADMIN_PASSWORD)

    const userId = crypto.randomUUID()
    const now = new Date()

    // Create user
    await db.insert(user).values({
      id: userId,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      emailVerified: true,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    })

    // Create credential account
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: ADMIN_EMAIL,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    })

    console.log(`Admin user created: ${ADMIN_EMAIL}`)
  }

  console.log('Done!')
  await client.end()
  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err)
  process.exit(1)
})
