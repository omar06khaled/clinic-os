import { createClient } from "@supabase/supabase-js"

// Service-role client — bypasses RLS, NEVER import in client components or expose to browser.
// Used exclusively in API routes for admin operations (e.g. auth.admin.inviteUserByEmail).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
