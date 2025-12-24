'use client'

import { createAuthClient } from 'better-auth/react'
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  magicLinkClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins'
import { stripeClient } from '@better-auth/stripe/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = '/2fa'
      },
    }),
    magicLinkClient(),
    inferAdditionalFields({
      user: {
        phoneNumber: {
          type: 'string',
          required: false,
        },
        theme: {
          type: 'string',
          required: false,
        },
        onboardingCompleted: {
          type: 'boolean',
          required: false,
        },
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
