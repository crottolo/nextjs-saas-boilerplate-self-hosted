import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, organization, twoFactor, magicLink } from 'better-auth/plugins'
import { db } from './db'
import { sendEmail } from './email'

// DEBUG: Log configurazione auth
console.log(
  '[Auth] Initializing with baseURL:',
  process.env.NEXT_PUBLIC_APP_URL
)
console.log('[Auth] NODE_ENV:', process.env.NODE_ENV)

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Cookie sicuri per HTTPS production
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // OAuth Providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: `
          <h1>Reset your password</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${url}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      })
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: `
          <h1>Verify your email</h1>
          <p>Click the link below to verify your email address:</p>
          <a href="${url}">Verify Email</a>
        `,
      })
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: 'Your Magic Link',
          html: `
            <h1>Sign in to your account</h1>
            <p>Click the link below to sign in:</p>
            <a href="${url}">Sign In</a>
            <p>This link will expire in 15 minutes.</p>
          `,
        })
      },
    }),
    twoFactor({
      issuer: 'AuthApp',
    }),
    organization({
      teams: {
        enabled: true,
      },
    }),
    admin(),
  ],

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'memory',
    customRules: {
      '/sign-in/*': { window: 60, max: 5 },
      '/sign-up/*': { window: 60, max: 3 },
      '/two-factor/*': { window: 60, max: 5 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
