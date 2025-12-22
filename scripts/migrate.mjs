import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

console.log("Connecting to database...")

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

console.log("Running migrations from ./drizzle folder...")

try {
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("Migrations completed successfully!")
} catch (error) {
  console.error("Migration failed:", error)
  // Don't exit with error - let the app start anyway
  // Tables might already exist
}

await client.end()
