# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Sistema di autenticazione completo self-hosted con Next.js, Better Auth e PostgreSQL.

## Stato del progetto

- Development in progress
- Nessuna migrazione db da fare, si riparte da zero ricreando lo schema da zero.
- Fino a quando non arriviamo ad un punto stabile, non dobbiamo fare la migrazione db.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router, React 19.2.3)
- **Auth**: Better Auth 1.4.9
- **ORM**: Drizzle ORM 0.45.1
- **Database**: PostgreSQL 16 + pgAdmin4
- **Email**: Nodemailer (SMTP)
- **Payments**: Stripe
- **UI**: shadcn/ui v4 + Tailwind CSS v4
- **Deploy**: Docker Compose (Coolify)

## Project Structure

```
app/
├── (auth)/              # Auth pages (login, reset, 2fa)
├── (auth-full)/         # Registration (full page)
├── (dashboard)/         # User dashboard, profile, organizations
├── (admin)/             # Admin panel
├── (public)/            # Privacy, terms
├── invite/[id]/         # Organization invite acceptance
└── api/
    ├── auth/[...all]/   # Better Auth API handler
    ├── admin/           # Admin-only endpoints
    ├── notifications/   # Notification CRUD
    ├── activity/        # Activity logging
    └── upload/          # File uploads

lib/
├── db/
│   └── auth-schema.ts   # Drizzle ORM schema (all tables)
├── auth.ts              # Better Auth server config
├── auth-client.ts       # Better Auth React client
├── email.ts             # Nodemailer integration
├── notifications.ts     # Notification helpers
└── activity.ts          # Activity logging helpers

components/
├── notifications/       # NotificationBell dropdown
├── admin/               # AdminSidebar
├── dashboard/           # AppSidebar, NavUser
├── organization/        # OrgSwitcher, InviteDialog, MembersTable
└── ui/                  # shadcn/ui components

proxy.ts                 # Next.js 16 route protection (NOT middleware.ts)
scripts/seed-admin.ts    # Create admin user
```

## Commands

```bash
# Development
pnpm dev                 # Start dev server (turbopack)

# Build
pnpm build               # Build for production
pnpm start               # Start production server

# Database
pnpm db:generate         # Generate Drizzle schema
pnpm db:migrate          # Run migrations
pnpm db:studio           # Open Drizzle Studio

# Admin
pnpm seed:admin          # Create admin user (uses ADMIN_EMAIL, ADMIN_PASSWORD env vars)

# Docker - Local (solo DB)
docker compose -f docker-compose.local.yml up -d      # Avvia PostgreSQL + pgAdmin
docker compose -f docker-compose.local.yml down       # Stop
docker compose -f docker-compose.local.yml down -v    # Stop + cancella dati
```

## Key Features

### Better Auth Plugins (Server)

- Email/password with email verification
- Magic link authentication
- Two-factor TOTP
- OAuth: GitHub, Google (optional)
- Organization plugin with email invites
- Admin plugin
- Stripe plugin (free/pro/enterprise plans)

### Better Auth Plugins (Client - lib/auth-client.ts)

```typescript
plugins: [
  adminClient(),
  organizationClient(),
  twoFactorClient(),
  magicLinkClient(),
  stripeClient(),
  inferAdditionalFields<typeof auth>(),
]
```

### Rate Limiting

- Login: 5/min
- Signup: 3/min
- 2FA: 5/min

### Session Config

- Duration: 7 days
- Refresh: every 24h
- Cookie caching: 5 min

## Database Schema (Key Tables)

| Table          | Purpose                      |
| -------------- | ---------------------------- |
| `user`         | Users + theme, onboarding    |
| `session`      | Multi-device sessions        |
| `account`      | OAuth/credential accounts    |
| `twoFactor`    | TOTP secrets + backup codes  |
| `organization` | Teams/workspaces             |
| `member`       | Org membership (owner/admin) |
| `invitation`   | Email invites to orgs        |
| `notification` | User notifications           |
| `activityLog`  | Action history               |
| `subscription` | Stripe subscriptions         |

## Notification System

**API Endpoints:**

- `GET /api/notifications` - Fetch user notifications (limit, unread params)
- `PATCH /api/notifications` - Mark as read (single or all)

**Admin:**

- `POST /api/admin/notifications/send` - Send to all or selected users

**Component:** `NotificationBell` - Dropdown bell with smart refresh (on route change, not polling)

## Activity Logging

```typescript
type ActivityAction =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'profile_updated'
  | 'email_verified'
  | 'organization_created'
  | 'organization_joined'
  | 'member_invited'
```

Auto-logged on login via Better Auth databaseHooks.

## Next.js 16 Proxy (NOT middleware.ts)

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

## Docker Compose Setup

### File separati:

- `docker-compose.yaml` - Production (Coolify magic variables)
- `docker-compose.local.yml` - Solo DB per sviluppo locale (standalone)

### Local Development

```bash
# 1. Avvia solo PostgreSQL + pgAdmin
docker compose -f docker-compose.local.yml up -d

# 2. Prima volta: genera e applica lo schema
pnpm db:generate
pnpm db:migrate

# 3. Avvia l'app Next.js
pnpm dev
```

### Accessi locali

| Servizio   | URL                   | Credenziali                |
| ---------- | --------------------- | -------------------------- |
| App        | http://localhost:3000 | -                          |
| pgAdmin    | http://localhost:5050 | admin@example.com/admin123 |
| PostgreSQL | localhost:5433        | postgres/postgres          |

### Gestione Database

```bash
# Reset completo (ricrea da zero)
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d
pnpm db:generate && pnpm db:migrate

# Solo rigenerare schema (dopo modifiche a auth-schema.ts)
pnpm db:generate
pnpm db:migrate

# Visualizza DB
pnpm db:studio
```

## Environment Variables

| Variable                             | Required | Description                       |
| ------------------------------------ | -------- | --------------------------------- |
| `DATABASE_URL`                       | ✅       | PostgreSQL connection string      |
| `BETTER_AUTH_SECRET`                 | ✅       | JWT/session secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL`                | ✅       | Base URL of the app               |
| `SMTP_HOST`                          | ✅       | SMTP server host                  |
| `SMTP_PORT`                          | ❌       | SMTP port (default: 587)          |
| `SMTP_USER`                          | ✅       | SMTP username                     |
| `SMTP_PASS`                          | ✅       | SMTP password                     |
| `EMAIL_FROM`                         | ✅       | Sender email address              |
| `GITHUB_CLIENT_ID/SECRET`            | ❌       | GitHub OAuth                      |
| `GOOGLE_CLIENT_ID/SECRET`            | ❌       | Google OAuth                      |
| `STRIPE_SECRET_KEY`                  | ❌       | Stripe secret key                 |
| `STRIPE_WEBHOOK_SECRET`              | ❌       | Stripe webhook secret             |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌       | Stripe public key                 |

## Framer Motion with React 19

```typescript
// Use motion/react instead of framer-motion
import { motion } from 'motion/react'
```

## Database Migrations & Seeds - CRITICAL

### Architettura Runtime vs Build

Le migrazioni e i seed vengono eseguiti **all'avvio del container** (runtime), NON durante il build Docker.

**Motivo**: Durante il build Docker, il container è isolato e non può accedere al database PostgreSQL.

### Flusso di esecuzione in produzione (Coolify)

```
Docker Build (pnpm build)     →  Container Start (scripts/start.sh)
      ↓                                    ↓
  Solo Next.js build               1. migrate.mjs (migrazioni)
  NO accesso al DB                 2. seed-plans.mjs (piani default)
                                   3. seed-admin.mjs (utente admin)
                                   4. node server.js (avvio app)
```

### Tipi di Script

| Estensione | Uso                    | Richiede       | Esempio                 |
| ---------- | ---------------------- | -------------- | ----------------------- |
| `.ts`      | Development (pnpm run) | `tsx`          | `scripts/seed-admin.ts` |
| `.mjs`     | Runtime (Docker)       | Node.js nativo | `scripts/migrate.mjs`   |

**IMPORTANTE**: Gli script `.mjs` devono usare ESM puro (import/export) senza dipendenze TypeScript.

### Modificare lo Schema Database

```bash
# 1. Modifica lib/db/auth-schema.ts

# 2. Genera la migrazione
pnpm db:generate

# 3. Applica localmente (dev)
pnpm db:migrate

# 4. Commit dei file in drizzle/
git add drizzle/

# 5. In produzione: le migrazioni si applicano automaticamente all'avvio
```

### Aggiungere un Nuovo Seed

1. Crea lo script `.ts` per dev:

```typescript
// scripts/seed-example.ts
import { config } from 'dotenv'
config({ path: '.env.local' })
// ... logica seed con drizzle
```

2. Crea la versione `.mjs` per runtime:

```javascript
// scripts/seed-example.mjs
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
// ... logica seed senza TypeScript
```

3. Aggiungi al `package.json`:

```json
"seed:example": "tsx scripts/seed-example.ts"
```

4. Aggiungi a `scripts/start.sh`:

```bash
echo "Seeding example..."
node scripts/seed-example.mjs
```

5. Il Dockerfile copia automaticamente tutti i file in `scripts/`

## Internationalization (i18n) - IMPORTANT

Il progetto usa **next-intl** per l'internazionalizzazione. Lingue supportate: `en`, `it`, `cz`.

### Linee guida OBBLIGATORIE per scrivere codice:

1. **MAI stringhe hardcoded in UI** - Tutte le stringhe visibili all'utente DEVONO usare le traduzioni:

```typescript
// ❌ SBAGLIATO
<Button>Save Changes</Button>
toast.error('Upload failed')

// ✅ CORRETTO
const t = useTranslations('profile')
<Button>{t('saveChanges')}</Button>
toast.error(t('uploadFailed'))
```

2. **Usare useTranslations nei componenti client**:

```typescript
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('namespace')
  const tCommon = useTranslations('common')
  // ...
}
```

3. **Link e Router DEVONO usare i18n/navigation**:

```typescript
// ❌ SBAGLIATO
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ✅ CORRETTO
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
```

4. **Aggiungere traduzioni in TUTTI i file JSON** (`messages/en.json`, `it.json`, `cz.json`):

```json
{
  "namespace": {
    "key": "English text",
    "nested": {
      "key": "Nested text"
    }
  }
}
```

5. **Namespace comuni già esistenti**:
   - `common` - bottoni generici (save, cancel, delete, etc.)
   - `nav` - navigazione sidebar
   - `theme` - opzioni tema (light, dark, system)
   - `profile` - pagina profilo
   - `dashboard` - dashboard principale
   - `organizations` - gestione organizzazioni
   - `pricing` - piani e abbonamenti
   - `admin` - pannello admin

### File di configurazione i18n:

- `i18n/config.ts` - Configurazione lingue
- `i18n/request.ts` - Request handler
- `i18n/navigation.ts` - Link e router localizzati
- `messages/*.json` - File traduzioni

## DO NOT

### General

- Do not use `middleware.ts` - Next.js 16 uses `proxy.ts`
- Do not use deprecated `getServerSession` - use `auth.api.getSession`
- Do not use `pages/` directory - use App Router only
- Do not use `ports:` in docker-compose.yaml for Coolify (proxy conflicts)
- Do not hardcode secrets - use environment variables
- Do not use Resend - project uses Nodemailer (SMTP)

### i18n

- **Do not hardcode UI strings** - use `useTranslations()` from next-intl
- **Do not use `next/link` or `next/navigation`** - use `@/i18n/navigation`

### Database & Migrations

- **Do not run migrations during Docker build** - il DB non è accessibile
- **Do not use `drizzle-kit migrate` in build script** - fallirà senza DATABASE_URL
- **Do not use tsx in runtime scripts** - usa `.mjs` con ESM puro
- **Do not forget to create both .ts and .mjs versions** - servono entrambi per dev e prod

## Documentation References

- `.claude/docs/COOLIFY.md` - Coolify deployment patterns
- `.claude/docs/NEXTJS.md` - Next.js patterns
- `.claude/docs/SHADCN.md` - shadcn/ui components
- `.claude/docs/TAILWIND.md` - Tailwind CSS v4
