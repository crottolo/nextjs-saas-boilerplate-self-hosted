import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { eq } from "drizzle-orm"
import { scrypt } from "@noble/hashes/scrypt"
import { bytesToHex, randomBytes } from "@noble/hashes/utils"
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core"

// Schema inline (to avoid import issues in standalone build)
const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
})

const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Better Auth scrypt config
const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
}

// Hash password in Better Auth format: salt:key (hex)
async function hashPassword(password) {
  const saltBytes = randomBytes(16)
  const saltHex = bytesToHex(saltBytes)
  const key = scrypt(password.normalize("NFKC"), saltHex, SCRYPT_CONFIG)
  return `${saltHex}:${bytesToHex(key)}`
}

// Configuration from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrator"

async function seedAdmin() {
  // Skip if no admin credentials configured
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("No ADMIN_EMAIL or ADMIN_PASSWORD configured, skipping admin seed")
    return
  }

  console.log("Seeding admin user...")

  const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  try {
    // Check if user exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1)

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0]
      console.log(`User ${ADMIN_EMAIL} already exists`)

      if (existingUser.role !== "admin") {
        console.log("Updating role to admin...")
        await db
          .update(user)
          .set({ role: "admin" })
          .where(eq(user.id, existingUser.id))
        console.log("User role updated to admin")
      } else {
        console.log("User is already an admin")
      }
    } else {
      console.log("Creating new admin user...")

      const hashedPassword = await hashPassword(ADMIN_PASSWORD)
      const userId = crypto.randomUUID()
      const now = new Date()

      // Create user
      await db.insert(user).values({
        id: userId,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        emailVerified: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      })

      // Create credential account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: ADMIN_EMAIL,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      })

      console.log(`Admin user created: ${ADMIN_EMAIL}`)
    }

    console.log("Admin seed completed!")
  } catch (error) {
    console.error("Admin seed error:", error)
    // Don't exit with error - let the app start anyway
  }

  await client.end()
}

seedAdmin()
