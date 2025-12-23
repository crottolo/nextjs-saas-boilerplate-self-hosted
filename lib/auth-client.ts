'use client'

import { createAuthClient } from 'better-auth/react'
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  magicLinkClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins'

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
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
