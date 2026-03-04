"use client"

import {
  useState,
  useRef,
  useEffect,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { ArrowLeft, Loader2 } from "lucide-react"

const DIGIT_COUNT = 6

export default function VerifyPage() {
  const [digits, setDigits]   = useState<string[]>(Array(DIGIT_COUNT).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [email, setEmail]     = useState<string>("")
  const inputRefs             = useRef<(HTMLInputElement | null)[]>([])
  const router                = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem("otp_email")
    if (!stored) {
      router.replace("/login")
      return
    }
    setEmail(stored)
    // Auto-focus first box
    inputRefs.current[0]?.focus()
  }, [router])

  function handleChange(index: number, raw: string) {
    // Only accept a single digit
    const value = raw.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError(null)

    if (value && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT)
    if (!pasted) return

    const next = [...digits]
    pasted.split("").forEach((ch, i) => { next[i] = ch })
    setDigits(next)

    const focusIndex = Math.min(pasted.length, DIGIT_COUNT - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = digits.join("")
    if (token.length < DIGIT_COUNT) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      setError("Invalid or expired code. Please try again.")
      setDigits(Array(DIGIT_COUNT).fill(""))
      inputRefs.current[0]?.focus()
      setLoading(false)
      return
    }

    sessionStorage.removeItem("otp_email")
    router.push("/")
  }

  const isComplete = digits.every((d) => d !== "")

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <h1 className="text-xl font-semibold mb-1">Check your email</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-foreground break-all">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* OTP digit inputs */}
        <div className="flex gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="h-12 w-full rounded-lg border bg-background text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive leading-snug">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !isComplete}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Verifying…" : "Verify & sign in"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Resend
          </Link>
        </p>
      </form>
    </div>
  )
}
