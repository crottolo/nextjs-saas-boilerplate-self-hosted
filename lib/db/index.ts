import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Supporta sia DATABASE_URL diretto che variabili separate (per Coolify)
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
