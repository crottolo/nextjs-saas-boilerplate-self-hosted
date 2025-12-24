import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, organization, twoFactor, magicLink } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { db } from './db'
import { sendEmail } from './email'

// Stripe client
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

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

  user: {
    additionalFields: {
      phoneNumber: {
        type: 'string',
        required: false,
        fieldName: 'phoneNumber',
      },
      theme: {
        type: 'string',
        required: false,
        defaultValue: 'system',
      },
      onboardingCompleted: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    },
  },

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
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.id}?email=${encodeURIComponent(data.email)}`
        await sendEmail({
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          html: `
            <h1>You're invited!</h1>
            <p><strong>${data.inviter.user.name}</strong> has invited you to join <strong>${data.organization.name}</strong>.</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a>
            <p>This invitation will expire in 48 hours.</p>
          `,
        })
      },
    }),
    admin(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: 'free',
            priceId: 'price_1ShnG5HkRKq5DDJHngiNkwFL',
            limits: { projects: 3, storage: 1 },
          },
          {
            name: 'pro',
            priceId: 'price_1ShnGWHkRKq5DDJHfQzl1IZb',
            limits: { projects: 20, storage: 50 },
            freeTrial: { days: 14 },
          },
          {
            name: 'enterprise',
            priceId: 'price_1ShnGpHkRKq5DDJHaMkkLqwB',
            limits: { projects: -1, storage: -1 }, // unlimited
          },
        ],
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create personal workspace for new users
          const baseURL =
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          try {
            await fetch(`${baseURL}/api/auth/organization/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `${user.name || 'My'} Workspace`,
                slug: `workspace-${user.id.slice(0, 8)}`,
                userId: user.id,
              }),
            })
            console.log('[Auth] Created personal workspace for user:', user.id)
          } catch (error) {
            console.error('[Auth] Failed to create personal workspace:', error)
          }
        },
      },
    },
  },

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
