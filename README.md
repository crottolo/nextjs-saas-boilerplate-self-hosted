# Auth App - Next.js + Better Auth + PostgreSQL

Sistema di autenticazione completo self-hosted.

## Features

- Email/password registration & login
- Magic link authentication
- Password reset via email
- 2FA/MFA con TOTP
- Multi-tenancy (organizzazioni)
- Rate limiting
- Session management multi-device
- Dashboard admin completa

## Quick Start

### 1. Prerequisiti

- Node.js 20+
- pnpm
- Docker e Docker Compose
- Account Resend (per email)

### 2. Setup Locale

```bash
# Clona e installa
git clone <repo>
cd auth-app
pnpm install

# Copia env
cp .env.example .env.local

# Avvia PostgreSQL
docker-compose up db -d

# Genera schema database
pnpm db:generate
pnpm db:migrate

# Avvia dev server
pnpm dev
```

## Configurazione Provider

### Resend (Email)

1. Crea account su [resend.com](https://resend.com)
2. Vai su **API Keys** → **Create API Key**
3. Copia la chiave e aggiungi a `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   ```
4. Vai su **Domains** → **Add Domain**
5. Configura i record DNS come indicato
6. Una volta verificato, imposta:
   ```env
   EMAIL_FROM=noreply@tuodominio.com
   ```

> **Nota**: In sviluppo puoi usare `onboarding@resend.dev` come mittente senza verificare un dominio.

### GitHub OAuth (Futuro)

1. Vai su [GitHub Developer Settings](https://github.com/settings/developers)
2. Clicca **New OAuth App**
3. Compila:
   - **Application name**: Nome app
   - **Homepage URL**: `http://localhost:3000` (dev) o URL produzione
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Dopo la creazione, genera un **Client Secret**
5. Aggiungi a `.env.local`:
   ```env
   GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Google OAuth (Futuro)

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto o seleziona esistente
3. Vai su **APIs & Services** → **Credentials**
4. Clicca **Create Credentials** → **OAuth client ID**
5. Configura **OAuth consent screen** se richiesto:
   - User Type: External
   - App name, email, logo
   - Scopes: `email`, `profile`, `openid`
6. Torna a Credentials → **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Aggiungi a `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
   ```

### Apple OAuth (Futuro)

1. Vai su [Apple Developer](https://developer.apple.com)
2. Vai su **Certificates, Identifiers & Profiles**
3. Crea un **App ID** con Sign In with Apple capability
4. Crea un **Services ID** per web auth
5. Configura **Return URLs**: `https://tuodominio.com/api/auth/callback/apple`
6. Genera una **Private Key** per Sign In with Apple
7. Aggiungi a `.env.local`:
   ```env
   APPLE_CLIENT_ID=com.tuodominio.auth
   APPLE_TEAM_ID=XXXXXXXXXX
   APPLE_KEY_ID=XXXXXXXXXX
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

## Variabili Ambiente

| Variabile | Descrizione | Obbligatorio |
|-----------|-------------|--------------|
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `BETTER_AUTH_SECRET` | Secret per JWT/sessioni (min 32 char) | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL base app | ✅ |
| `RESEND_API_KEY` | API key Resend | ✅ |
| `EMAIL_FROM` | Email mittente | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | ❌ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | ❌ |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | ❌ |

## Generare BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
# oppure
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deploy su Coolify

1. Crea nuovo progetto su Coolify
2. Connetti repository Git
3. Coolify rileverà automaticamente `docker-compose.yaml`
4. Configura le variabili ambiente nel pannello Coolify
5. Deploy!

## Scripts Disponibili

```bash
pnpm dev          # Avvia dev server
pnpm build        # Build produzione
pnpm start        # Avvia produzione
pnpm db:generate  # Genera schema Drizzle
pnpm db:migrate   # Esegui migrazioni
pnpm db:studio    # Apri Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Better Auth
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 16
- **Email**: Resend
- **UI**: shadcn/ui + Tailwind CSS
- **Deploy**: Docker Compose (Coolify)
