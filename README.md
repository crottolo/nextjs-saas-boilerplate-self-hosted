<p align="center">
  <img src="public/logo.svg" alt="Logo" width="80" height="80" />
</p>

<h1 align="center">SaaS Starter Kit</h1>

<p align="center">
  <strong>The only self-hosted SaaS boilerplate with Docker + Coolify out of the box</strong>
</p>

<p align="center">
  Ship your SaaS in days, not months. Own your infrastructure.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Coolify-Compatible-6366F1?style=flat-square" alt="Coolify" />
</p>

---

## Why This Boilerplate?

Most SaaS boilerplates lock you into **Vercel** with unpredictable costs. This one is different:

| Problem                     | Our Solution                            |
| --------------------------- | --------------------------------------- |
| Vercel costs $50-200+/month | Self-host on a **€5/month VPS**         |
| Vendor lock-in              | **Docker Compose** + any cloud          |
| No control over data        | **Your server, your data** (GDPR ready) |
| Complex Stripe setup        | **Create products from dashboard**      |
| Manual DB management        | **pgAdmin included**                    |

---

## Features

### Authentication (Better Auth)

- [x] Email/Password with email verification
- [x] Magic Link (passwordless login)
- [x] OAuth providers: Google & GitHub
- [x] Password reset via email
- [x] Two-Factor Authentication (2FA/TOTP)
- [x] Backup codes for 2FA recovery
- [x] Session management (multi-device)
- [x] Change password
- [x] Trust device option
- [x] Rate limiting (login: 5/min, signup: 3/min, 2FA: 5/min)

### Payments (Stripe)

- [x] Subscription management
- [x] Webhook integration (checkout, subscription, invoice, payment)
- [x] Plan upgrade/downgrade with validation
- [x] Downgrade protection (blocks if org limit exceeded)
- [x] Customer billing portal
- [x] **Create products from admin dashboard** ⭐
- [x] **Sync products from Stripe** ⭐
- [x] **View all subscriptions** ⭐
- [x] Multi-plan support (Free, Starter, Plus, Pro, Agency)
- [x] Monthly/Yearly billing toggle
- [x] Trial days support
- [x] Featured plan highlight

### Admin Panel

- [x] Dashboard with user stats
- [x] User management (list, search, ban/unban, delete)
- [x] Reset user password
- [x] Change user email
- [x] View active sessions
- [x] Revoke user sessions
- [x] Organization management
- [x] **Stripe products CRUD** ⭐
- [x] **Subscriptions overview** ⭐
- [x] Plans management
- [x] Send notifications (single user or broadcast)
- [x] Multilingual notification support

### Organizations (Multi-tenancy)

- [x] Create organizations/workspaces
- [x] Organization limits per plan
- [x] Progress bar for organization usage
- [x] Invite members via email (48h expiry)
- [x] Role management (Owner, Admin, Member)
- [x] Role badges with colors
- [x] Remove members
- [x] Organization switcher in sidebar
- [x] Auto-create personal workspace on signup

### User Portal

- [x] Dashboard with account overview
- [x] Session info display
- [x] Quick actions
- [x] Profile management
- [x] Avatar upload (drag & drop, 2MB limit)
- [x] Phone number field
- [x] Theme switcher (Light/Dark/System)
- [x] Theme persistence in database
- [x] Notification center (bell dropdown)
- [x] Smart notification refresh (on route change)
- [x] Mark notifications as read (single/all)
- [x] Activity history log

### Activity Logging

Automatic tracking of:

- [x] Login/Logout events
- [x] Password changes
- [x] Password resets
- [x] 2FA enabled/disabled
- [x] Profile updates
- [x] Email verification
- [x] Subscription changes
- [x] Organization events
- [x] Member invitations
- [x] IP address & User Agent logging

### Notifications System

- [x] Multiple types: info, success, warning, system, invite
- [x] Multilingual content (JSONB)
- [x] Link support for actions
- [x] Unread count badge
- [x] Admin broadcast to all users
- [x] Admin send to specific users

### Infrastructure

- [x] **Docker Compose (3 containers)** ⭐
- [x] **Coolify-ready deployment** ⭐
- [x] **pgAdmin included** ⭐
- [x] PostgreSQL 16
- [x] Automatic migrations on container startup
- [x] Automatic seeds (plans, admin user)
- [x] SMTP email (Nodemailer)
- [x] File uploads with validation

### Internationalization (i18n)

- [x] Multi-language support (EN, IT, CZ)
- [x] next-intl integration
- [x] Localized routing (`/en/`, `/it/`, `/cz/`)
- [x] Language switcher with flags
- [x] Translated UI components
- [x] Multilingual database fields (JSONB)

### Developer Experience

- [x] TypeScript throughout
- [x] Drizzle ORM with migrations
- [x] 14 database tables
- [x] shadcn/ui components (30+)
- [x] Tailwind CSS v4
- [x] ESLint + Prettier
- [x] Turbopack dev server

### Pages (28 total)

**Public:**

- Login, Register, Verify Email, Reset Password
- 2FA Verification, 2FA Setup
- Accept Invitation
- Privacy Policy, Terms of Service

**Dashboard:**

- Dashboard, Profile, Organizations, Pricing
- Activity Log, Help, Onboarding
- Create Organization, Organization Details

**Admin:**

- Overview, Users, Sessions, Organizations
- Plans, Stripe Products, Subscriptions
- Notifications, Settings

### API Endpoints (30+)

- Authentication (Better Auth handler)
- Notifications CRUD
- Activity logging
- File uploads
- Plans & User limits
- Stripe checkout & webhooks
- Subscription management
- Admin operations

---

## Screenshots

<!-- Add your screenshots here -->
<!--
![Login](public/screenshots/login.png)
![Dashboard](public/screenshots/dashboard.png)
![Admin](public/screenshots/admin.png)
-->

| Login                                  | Dashboard                                      |
| -------------------------------------- | ---------------------------------------------- |
| ![Login](public/screenshots/login.png) | ![Dashboard](public/screenshots/dashboard.png) |

| Profile                                    | Organizations                                          |
| ------------------------------------------ | ------------------------------------------------------ |
| ![Profile](public/screenshots/profile.png) | ![Organizations](public/screenshots/organizations.png) |

| Admin Dashboard                        | Stripe Products                                   |
| -------------------------------------- | ------------------------------------------------- |
| ![Admin](public/screenshots/admin.png) | ![Stripe](public/screenshots/stripe-products.png) |

---

## Comparison with Competitors

| Feature                            | ShipFast $199 | Supastarter $299 | **This Kit** |
| ---------------------------------- | :-----------: | :--------------: | :----------: |
| Auth (Email, OAuth, Magic Link)    |      ✅       |        ✅        |      ✅      |
| Two-Factor Auth (2FA/TOTP)         |      ❌       |        ❌        |      ✅      |
| Stripe Subscriptions               |      ✅       |        ✅        |      ✅      |
| Admin Panel                        |      ❌       |        ✅        |      ✅      |
| Multi-language (i18n)              |      ❌       |        ✅        |      ✅      |
| Organizations/Teams                |      ❌       |        ✅        |      ✅      |
| **Docker Compose Ready**           |      ❌       |        ⚠️        |      ✅      |
| **Coolify Compatible**             |      ❌       |        ❌        |      ✅      |
| **pgAdmin Included**               |      ❌       |        ❌        |      ✅      |
| **Create Stripe Products from UI** |      ❌       |        ❌        |      ✅      |
| **Self-hosted by Default**         |      ❌       |        ❌        |      ✅      |
| Session Management                 |      ❌       |        ❌        |      ✅      |
| Activity Logging                   |      ❌       |        ⚠️        |      ✅      |
| Notification System                |      ❌       |        ⚠️        |      ✅      |

---

## Tech Stack

| Layer         | Technology                        |
| ------------- | --------------------------------- |
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language**  | TypeScript 5                      |
| **Auth**      | Better Auth 1.4                   |
| **Database**  | PostgreSQL 16                     |
| **ORM**       | Drizzle ORM                       |
| **Payments**  | Stripe                            |
| **Email**     | Nodemailer (SMTP)                 |
| **UI**        | shadcn/ui + Tailwind CSS v4       |
| **i18n**      | next-intl                         |
| **Deploy**    | Docker + Coolify                  |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone <your-repo>
cd saas-starter
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/auth_app

# Auth
BETTER_AUTH_SECRET=your-secret-min-32-chars

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OAuth (optional)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin
```

### 3. Start Database

```bash
docker compose -f docker-compose.local.yml up -d
```

### 4. Run Migrations & Seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm seed:plans    # Create default plans
pnpm seed:admin    # Create admin user
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Self-Hosted with Coolify (Recommended)

1. Install [Coolify](https://coolify.io) on your VPS
2. Create a new project
3. Connect your Git repository
4. Coolify auto-detects `docker-compose.yaml`
5. Configure environment variables
6. Deploy!

**Cost: ~€5-10/month** for a VPS (Hetzner, DigitalOcean, etc.)

### Docker Compose (Manual)

```bash
docker compose up -d
```

This starts 3 containers:

- **PostgreSQL** - Database
- **pgAdmin** - Database UI
- **Next.js App** - Your application

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Docker Compose                    │
├─────────────────┬─────────────────┬─────────────────┤
│   PostgreSQL    │    pgAdmin      │   Next.js App   │
│   Port: 5432    │   Port: 5050    │   Port: 3000    │
└─────────────────┴─────────────────┴─────────────────┘
```

### Container Startup Flow

```
Container Start (scripts/start.sh)
         ↓
1. migrate.mjs    → Create/update database tables
2. seed-plans.mjs → Create default subscription plans
3. seed-admin.mjs → Create admin user
4. node server.js → Start Next.js application
```

---

## Database Schema

14 tables managed by Drizzle ORM:

| Table           | Purpose                           |
| --------------- | --------------------------------- |
| `user`          | Users + theme, onboarding         |
| `session`       | Multi-device sessions             |
| `account`       | OAuth/credential accounts         |
| `twoFactor`     | TOTP secrets + backup codes       |
| `verification`  | Email verification tokens         |
| `organization`  | Teams/workspaces                  |
| `member`        | Organization membership           |
| `invitation`    | Email invites (48h expiry)        |
| `team`          | Sub-teams within organizations    |
| `teamMember`    | Team membership                   |
| `notification`  | User notifications (multilingual) |
| `activityLog`   | Action history with IP/UA         |
| `plans`         | Subscription plans + limits       |
| `stripeProduct` | Stripe product mapping            |
| `subscription`  | User subscriptions                |

---

## Project Structure

```
├── app/
│   ├── [locale]/
│   │   ├── (auth)/           # Login, Register, Reset, 2FA
│   │   ├── (auth-full)/      # Full-page auth layouts
│   │   ├── (dashboard)/      # User dashboard pages
│   │   ├── (admin)/          # Admin panel
│   │   ├── (public)/         # Privacy, Terms
│   │   └── invite/[id]/      # Invitation acceptance
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn/ui (30+ components)
│   ├── auth/                 # Login/Signup forms
│   ├── dashboard/            # Sidebar, NavUser
│   ├── admin/                # Admin components
│   ├── organization/         # OrgSwitcher, Members
│   ├── profile/              # AvatarUpload
│   └── notifications/        # NotificationBell
├── lib/
│   ├── auth.ts               # Better Auth config
│   ├── auth-client.ts        # Client-side auth
│   ├── db/                   # Drizzle schema (14 tables)
│   ├── plans.ts              # Plan logic & limits
│   ├── notifications.ts      # Notification helpers
│   ├── activity.ts           # Activity logging
│   └── email.ts              # Nodemailer
├── messages/                 # i18n (en.json, it.json, cz.json)
├── scripts/                  # Seeds & migrations (.ts + .mjs)
├── drizzle/                  # Migration files
└── docker-compose.yaml       # Production setup
```

---

## Scripts

```bash
# Development
pnpm dev                 # Start dev server (Turbopack)

# Build
pnpm build               # Build for production
pnpm start               # Start production server

# Database
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Run migrations
pnpm db:studio           # Open Drizzle Studio

# Seeds
pnpm seed:admin          # Create admin user
pnpm seed:plans          # Create default plans
```

---

## Environment Variables

| Variable                             | Required | Description                  |
| ------------------------------------ | :------: | ---------------------------- |
| `DATABASE_URL`                       |    ✅    | PostgreSQL connection string |
| `BETTER_AUTH_SECRET`                 |    ✅    | JWT secret (min 32 chars)    |
| `NEXT_PUBLIC_APP_URL`                |    ✅    | Your app URL                 |
| `SMTP_HOST`                          |    ✅    | SMTP server host             |
| `SMTP_USER`                          |    ✅    | SMTP username                |
| `SMTP_PASS`                          |    ✅    | SMTP password                |
| `EMAIL_FROM`                         |    ✅    | Sender email                 |
| `STRIPE_SECRET_KEY`                  |    ⚠️    | Stripe secret key            |
| `STRIPE_WEBHOOK_SECRET`              |    ⚠️    | Stripe webhook secret        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |    ⚠️    | Stripe public key            |
| `GITHUB_CLIENT_ID`                   |    ❌    | GitHub OAuth                 |
| `GITHUB_CLIENT_SECRET`               |    ❌    | GitHub OAuth                 |
| `GOOGLE_CLIENT_ID`                   |    ❌    | Google OAuth                 |
| `GOOGLE_CLIENT_SECRET`               |    ❌    | Google OAuth                 |
| `ADMIN_EMAIL`                        |    ❌    | Admin user email             |
| `ADMIN_PASSWORD`                     |    ❌    | Admin user password          |

---

## Local Services

| Service    | URL                   | Credentials                  |
| ---------- | --------------------- | ---------------------------- |
| App        | http://localhost:3000 | -                            |
| pgAdmin    | http://localhost:5050 | admin@example.com / admin123 |
| PostgreSQL | localhost:5433        | postgres / postgres          |

---

## License

This project is licensed for personal and commercial use. See LICENSE for details.

---

<p align="center">
  <strong>Stop paying Vercel. Own your infrastructure.</strong>
</p>

<p align="center">
  Built with ❤️ for indie hackers and developers who want control.
</p>
