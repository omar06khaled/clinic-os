import createIntlMiddleware from "next-intl/middleware"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that do not require authentication
const PUBLIC_PATHS = ["/login", "/verify"]

// Keep in sync with i18n.ts
const intlMiddleware = createIntlMiddleware({
  locales: ["en", "ar"] as const,
  defaultLocale: "en",
  localePrefix: "never",
})

export async function middleware(request: NextRequest) {
  // ── 1. Locale detection ──────────────────────────────────────────────────
  // intlMiddleware reads the NEXT_LOCALE cookie and sets X-NEXT-INTL-LOCALE
  // on its response headers. We fall back to reading the cookie directly in
  // case the header is absent (version differences in next-intl behaviour).
  const intlResult = intlMiddleware(request)
  const locale =
    intlResult.headers.get("X-NEXT-INTL-LOCALE") ??
    request.cookies.get("NEXT_LOCALE")?.value ??
    "en"

  console.log("[middleware] NEXT_LOCALE cookie =", request.cookies.get("NEXT_LOCALE")?.value, "| resolved locale =", locale)

  // Factory: every response we return must carry X-NEXT-INTL-LOCALE on the
  // forwarded request headers (for RSCs via headers()) AND on the response
  // headers (belt-and-suspenders for next-intl internals).
  function makeResponse() {
    const forwardedHeaders = new Headers(request.headers)
    forwardedHeaders.set("X-NEXT-INTL-LOCALE", locale)
    const res = NextResponse.next({ request: { headers: forwardedHeaders } })
    res.headers.set("X-NEXT-INTL-LOCALE", locale)
    return res
  }

  // ── 2. Supabase auth ─────────────────────────────────────────────────────
  let response = makeResponse()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate via factory so the locale header is never lost when
          // Supabase refreshes the session and overwrites the response object.
          response = makeResponse()
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Unauthenticated → redirect to /login
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated + on an auth page → redirect to dashboard
  const hasError = request.nextUrl.searchParams.has("error")
  if (user && isPublic && !hasError) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/"
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
