import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

/**
 * Supabase auth callback handler.
 * Called when Supabase redirects back after a magic-link click.
 * Exchanges the one-time `code` for a session and redirects to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — send back to login with a flag
  return NextResponse.redirect(`${origin}/login?error=callback_failed`)
}
