# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Sistema di autenticazione completo self-hosted con Next.js, Better Auth e PostgreSQL.

## Stato del progetto
- Development in progress 
- Nessuna migrazione db da fare, si riparte da zero ricreando lo schema da zero.
- Fino a quando non arriviamo ad un punto stabile, non dobbiamo fare la migrazione db.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Auth**: Better Auth
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 16 + pgAdmin4
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

proxy.ts                 # Next.js 16 route protection (replaces middleware.ts)
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

# Docker - Local Development
docker compose -f docker-compose.yaml -f docker-compose.local.yml --env-file .env.docker up -d

# Docker - Production (Coolify reads docker-compose.yaml automatically)
```

## Next.js 16 Proxy (NOT middleware.ts)

Next.js 16 uses `proxy.ts` instead of `middleware.ts` for route protection:

```typescript
// proxy.ts - NOT middleware.ts!
export async function proxy(request: NextRequest) {
  // Check both cookie names (HTTPS uses __Secure- prefix)
  const sessionCookie =
    request.cookies.get('__Secure-better-auth.session_token') ||
    request.cookies.get('better-auth.session_token')
  // ...
}
```

## Better Auth Configuration

### Secure Cookies for HTTPS

```typescript
// lib/auth.ts
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  // ...
})
```

### Client Config (`lib/auth-client.ts`)

```typescript
'use client'
import { createAuthClient } from 'better-auth/react'
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  magicLinkClient,
} from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
  ],
})

export const { useSession } = authClient
```

## Docker Compose Setup

### Two-file approach for local vs production:

- `docker-compose.yaml` - Production config (no ports, Coolify magic variables)
- `docker-compose.local.yml` - Local overrides (ports, auto-connect pgAdmin)
- `.env.docker` - Local environment variables

### Coolify Magic Variables

```yaml
# Auto-generated credentials
- POSTGRES_USER=$SERVICE_USER_POSTGRESQL
- POSTGRES_PASSWORD=$SERVICE_PASSWORD_POSTGRESQL
- BETTER_AUTH_SECRET=$SERVICE_BASE64_64_AUTH

# Auto-generated URL
- SERVICE_FQDN_PGADMIN_80 # Generates domain for pgAdmin
```

### Local Development

```bash
# Start PostgreSQL (port 5433) and pgAdmin (port 5050)
docker compose -f docker-compose.yaml -f docker-compose.local.yml --env-file .env.docker up -d

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/auth_app" pnpm db:migrate
```

## Database (Drizzle)

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

## Framer Motion with React 19

```typescript
// Use motion/react instead of framer-motion
import { motion } from 'motion/react'
```

## Environment Variables

| Variable              | Description                       |
| --------------------- | --------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string      |
| `BETTER_AUTH_SECRET`  | JWT/session secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app               |
| `RESEND_API_KEY`      | Resend API key for emails         |
| `EMAIL_FROM`          | Sender email address              |

## DO NOT

- Do not use `middleware.ts` - Next.js 16 uses `proxy.ts`
- Do not use deprecated `getServerSession` - use Better Auth `auth.api.getSession`
- Do not use `pages/` directory - use App Router only
- Do not use `ports:` in docker-compose.yaml for Coolify (proxy conflicts)
- Do not hardcode secrets - use environment variables

## Documentation References

- `.claude/docs/COOLIFY.md` - Coolify deployment patterns
- `.claude/docs/NEXTJS.md` - Next.js patterns
- `.claude/docs/SHADCN.md` - shadcn/ui components
- `.claude/docs/TAILWIND.md` - Tailwind CSS v4
