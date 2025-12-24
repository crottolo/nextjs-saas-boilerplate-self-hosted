'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from '@/lib/auth-client'

export function ThemeSync() {
  const { setTheme } = useTheme()
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.theme) {
      setTheme(session.user.theme)
    }
  }, [session?.user?.theme, setTheme])

  return null
}
