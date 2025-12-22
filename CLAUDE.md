# CLAUDE.md

## Project Purpose

Sistema di autenticazione completo self-hosted con Next.js, Better Auth e PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Auth**: Better Auth
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 16
- **Email**: Resend
- **UI**: shadcn/ui v4 + Tailwind CSS v4
- **Deploy**: Docker Compose (Coolify)

## Project Structure

```
app/
├── (auth)/              # Auth pages (login, register, reset, 2fa)
├── (dashboard)/         # User dashboard & settings
├── (admin)/             # Admin panel
└── api/auth/[...all]/   # Better Auth API handler

lib/
├── db/                  # Drizzle ORM config & schema
├── auth.ts              # Better Auth server config
├── auth-client.ts       # Better Auth React client
└── email.ts             # Resend integration

components/ui/           # shadcn/ui components
```

## Commands

```bash
# Development
pnpm dev                 # Start dev server

# Build
pnpm build               # Build for production
pnpm start               # Start production server

# Database
pnpm db:generate         # Generate Drizzle schema
pnpm db:migrate          # Run migrations
pnpm db:studio           # Open Drizzle Studio

# Docker
docker-compose up db -d  # Start PostgreSQL only
docker-compose up        # Start full stack
```

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `"use client"` directive only when needed
- Follow Next.js App Router conventions
- Use route groups for layout isolation: `(auth)`, `(dashboard)`, `(admin)`

## Better Auth Patterns

### Server Config (`lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization, twoFactor, magicLink } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [magicLink(), twoFactor(), organization(), admin()],
})
```

### Client Config (`lib/auth-client.ts`)
```typescript
"use client"
import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient, twoFactorClient, magicLinkClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient(), twoFactorClient(), magicLinkClient()],
})

export const { useSession } = authClient
```

### API Handler (`app/api/auth/[...all]/route.ts`)
```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { POST, GET } = toNextJsHandler(auth)
```

## Database Patterns (Drizzle)

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

## Next.js 15/16 Breaking Changes

- App Router is default
- React 19 compatibility required
- Turbopack available for dev
- Server Components by default
- Use `"use client"` for client components

## Framer Motion with React 19

```typescript
// Use motion/react instead of framer-motion
import { motion } from "motion/react"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | JWT/session secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app |
| `RESEND_API_KEY` | Resend API key for emails |
| `EMAIL_FROM` | Sender email address |

## DO NOT

- Do not use deprecated `getServerSession` - use Better Auth `auth.api.getSession`
- Do not use `pages/` directory - use App Router only
- Do not hardcode secrets - use environment variables
- Do not skip email verification in production
- Do not disable rate limiting in production

## Documentation References

- `.claude/docs/NEXTJS.md` - Next.js patterns
- `.claude/docs/SHADCN.md` - shadcn/ui components
- `.claude/docs/TAILWIND.md` - Tailwind CSS v4
