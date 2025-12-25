import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { plans } from '../lib/db/auth-schema'
import type { LocalizedField } from '../lib/db/localized'

interface PlanSeed {
  id: string
  name: LocalizedField
  description: LocalizedField
  price: number // cents EUR
  credits: number
  maxOrganizations: number // -1 = unlimited
  sortOrder: number
  isDefault: boolean
}

const defaultPlans: PlanSeed[] = [
  {
    id: 'free',
    name: { en: 'Free Plan', it: 'Piano Gratuito', cz: 'Zdarma' },
    description: {
      en: 'Perfect for getting started',
      it: 'Perfetto per iniziare',
      cz: 'Idealni pro zacatek',
    },
    price: 0,
    credits: 100,
    maxOrganizations: 1,
    sortOrder: 0,
    isDefault: true,
  },
  {
    id: 'starter',
    name: { en: 'Starter', it: 'Starter', cz: 'Starter' },
    description: {
      en: 'For individuals and small projects',
      it: 'Per individui e piccoli progetti',
      cz: 'Pro jednotlivce a male projekty',
    },
    price: 900, // €9
    credits: 500,
    maxOrganizations: 3,
    sortOrder: 1,
    isDefault: false,
  },
  {
    id: 'plus',
    name: { en: 'Plus', it: 'Plus', cz: 'Plus' },
    description: {
      en: 'For growing teams',
      it: 'Per team in crescita',
      cz: 'Pro rostouci tymy',
    },
    price: 1900, // €19
    credits: 2000,
    maxOrganizations: 5,
    sortOrder: 2,
    isDefault: false,
  },
  {
    id: 'pro',
    name: { en: 'Pro', it: 'Pro', cz: 'Pro' },
    description: {
      en: 'For professionals and teams',
      it: 'Per professionisti e team',
      cz: 'Pro profesionaly a tymy',
    },
    price: 4900, // €49
    credits: 10000,
    maxOrganizations: 20,
    sortOrder: 3,
    isDefault: false,
  },
  {
    id: 'agency',
    name: { en: 'Agency', it: 'Agency', cz: 'Agentura' },
    description: {
      en: 'For agencies and enterprises',
      it: 'Per agenzie e aziende',
      cz: 'Pro agentury a podniky',
    },
    price: 9900, // €99
    credits: 50000,
    maxOrganizations: -1, // unlimited
    sortOrder: 4,
    isDefault: false,
  },
]

async function seedPlans() {
  console.log('Connecting to database...')

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client)

  console.log('Seeding plans...')

  for (const plan of defaultPlans) {
    await db
      .insert(plans)
      .values(plan)
      .onConflictDoUpdate({
        target: plans.id,
        set: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          credits: plan.credits,
          maxOrganizations: plan.maxOrganizations,
          sortOrder: plan.sortOrder,
          isDefault: plan.isDefault,
        },
      })
    console.log(`  ✓ ${plan.id}`)
  }

  console.log('Done! Seeded', defaultPlans.length, 'plans')
  await client.end()
  process.exit(0)
}

seedPlans().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
