// Better Auth schema
export * from "./auth-schema"

// Custom types (if needed)
import { user } from "./auth-schema"

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
