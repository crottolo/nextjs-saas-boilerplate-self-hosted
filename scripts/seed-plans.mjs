import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

const defaultPlans = [
  {
    id: 'free',
    name: { en: 'Free Plan', it: 'Piano Gratuito', cz: 'Zdarma' },
    description: { en: 'Perfect for getting started', it: 'Perfetto per iniziare', cz: 'Idealni pro zacatek' },
    price: 0,
    credits: 100,
    maxOrganizations: 1,
    sortOrder: 0,
    isDefault: true,
  },
  {
    id: 'starter',
    name: { en: 'Starter', it: 'Starter', cz: 'Starter' },
    description: { en: 'For individuals and small projects', it: 'Per individui e piccoli progetti', cz: 'Pro jednotlivce a male projekty' },
    price: 900,
    credits: 500,
    maxOrganizations: 3,
    sortOrder: 1,
    isDefault: false,
  },
  {
    id: 'plus',
    name: { en: 'Plus', it: 'Plus', cz: 'Plus' },
    description: { en: 'For growing teams', it: 'Per team in crescita', cz: 'Pro rostouci tymy' },
    price: 1900,
    credits: 2000,
    maxOrganizations: 5,
    sortOrder: 2,
    isDefault: false,
  },
  {
    id: 'pro',
    name: { en: 'Pro', it: 'Pro', cz: 'Pro' },
    description: { en: 'For professionals and teams', it: 'Per professionisti e team', cz: 'Pro profesionaly a tymy' },
    price: 4900,
    credits: 10000,
    maxOrganizations: 20,
    sortOrder: 3,
    isDefault: false,
  },
  {
    id: 'agency',
    name: { en: 'Agency', it: 'Agency', cz: 'Agentura' },
    description: { en: 'For agencies and enterprises', it: 'Per agenzie e aziende', cz: 'Pro agentury a podniky' },
    price: 9900,
    credits: 50000,
    maxOrganizations: -1,
    sortOrder: 4,
    isDefault: false,
  },
]

console.log("Connecting to database for plans seeding...")

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

try {
  console.log("Seeding plans...")

  for (const plan of defaultPlans) {
    await db.execute(sql`
      INSERT INTO plans (id, name, description, price, credits, max_organizations, sort_order, is_default, created_at)
      VALUES (
        ${plan.id},
        ${JSON.stringify(plan.name)}::jsonb,
        ${JSON.stringify(plan.description)}::jsonb,
        ${plan.price},
        ${plan.credits},
        ${plan.maxOrganizations},
        ${plan.sortOrder},
        ${plan.isDefault},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        credits = EXCLUDED.credits,
        max_organizations = EXCLUDED.max_organizations,
        sort_order = EXCLUDED.sort_order,
        is_default = EXCLUDED.is_default,
        updated_at = NOW()
    `)
    console.log(`  ✓ ${plan.id}`)
  }

  console.log("Plans seeding completed!")
} catch (error) {
  console.error("Plans seeding failed:", error)
  // Don't exit with error - let the app start anyway
}

await client.end()
