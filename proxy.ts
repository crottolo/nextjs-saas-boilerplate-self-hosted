import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/register", "/reset-password", "/verify", "/2fa"]
const authPaths = ["/login", "/register", "/reset-password"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // DEBUG: Log cookies disponibili
  const allCookies = request.cookies.getAll()
  console.log("[Proxy] pathname:", pathname)
  console.log("[Proxy] cookies:", allCookies.map(c => c.name))

  // Get session from Better Auth - check both possible cookie names
  // In HTTPS with useSecureCookies, the cookie name has __Secure- prefix
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token")

  console.log("[Proxy] sessionCookie found:", sessionCookie?.name, "hasValue:", !!sessionCookie?.value)

  const hasSession = !!sessionCookie?.value

  // Check if path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  // Redirect to login if no session and trying to access protected route
  if (!hasSession && !isPublicPath) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if has session and trying to access auth pages
  if (hasSession && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
