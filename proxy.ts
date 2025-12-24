import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing)

// Locales supported
const locales = ['en', 'it', 'cz']

// Public paths (without locale prefix)
const publicPathsWithoutLocale = [
  '/', // root becomes /[locale]
  '/register',
  '/reset-password',
  '/verify',
  '/2fa',
  '/invite',
]

// Auth paths that redirect to dashboard when logged in
const authPathsWithoutLocale = ['/', '/register', '/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if pathname has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If no locale in path, let next-intl handle the redirect
  if (!pathnameHasLocale) {
    return intlMiddleware(request)
  }

  // Extract locale and path without locale
  const locale = pathname.split('/')[1]
  const pathWithoutLocale = pathname.slice(locale.length + 1) || '/'

  // Get session from Better Auth - check both possible cookie names
  // In HTTPS with useSecureCookies, the cookie name has __Secure- prefix
  const sessionCookie =
    request.cookies.get('__Secure-better-auth.session_token') ||
    request.cookies.get('better-auth.session_token')

  const hasSession = !!sessionCookie?.value

  // Check if path is public (using path without locale)
  const isPublicPath = publicPathsWithoutLocale.some(
    (path) =>
      pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  )
  const isAuthPath = authPathsWithoutLocale.some(
    (path) =>
      pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  )

  // Redirect to login if no session and trying to access protected route
  if (!hasSession && !isPublicPath) {
    const url = new URL(`/${locale}`, request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if has session and trying to access auth pages
  if (hasSession && isAuthPath) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  // If we have a valid locale in path, just proceed without intl middleware redirect
  // intlMiddleware is only needed for paths without locale to add the locale
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
