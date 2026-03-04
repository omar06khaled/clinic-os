"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Mail, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Prevent auto-creating accounts — doctors must be pre-registered
        shouldCreateUser: false,
        // Tell Supabase exactly where to redirect after the link is clicked
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError("Could not send a code. Please check the email and try again.")
      setLoading(false)
      return
    }

    // Store email so the verify page can use it
    sessionStorage.setItem("otp_email", email)
    setSent(true)
    router.push("/verify")
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <h1 className="text-xl font-semibold mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email address and we&apos;ll send you a one-time code.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@yourclinic.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50 transition-shadow"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive leading-snug">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || sent}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Sending…" : "Send code"}
        </button>
      </form>
    </div>
  )
}
