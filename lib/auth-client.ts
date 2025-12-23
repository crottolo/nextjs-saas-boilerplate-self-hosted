'use client'

import { createAuthClient } from 'better-auth/react'
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  magicLinkClient,
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
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
