"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  name: string
  email: string
  role: string
}

function getRoleBadgeClass(role: string) {
  if (role === "owner")        return "border-rose-500/40 text-rose-600 bg-rose-50 dark:bg-rose-950/20"
  if (role === "admin")        return "border-amber-500/40 text-amber-600 bg-amber-50 dark:bg-amber-950/20"
  if (role === "receptionist") return "border-purple-500/40 text-purple-600 bg-purple-50 dark:bg-purple-950/20"
  return "border-blue-500/40 text-blue-600 bg-blue-50 dark:bg-blue-950/20"
}

function getRoleLabel(role: string) {
  if (role === "owner")        return "Owner"
  if (role === "admin")        return "Admin"
  if (role === "receptionist") return "Receptionist"
  return "Doctor"
}

export function AccountSection({ name, email: initialEmail, role }: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim().toLowerCase() === initialEmail.toLowerCase()) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch("/api/settings/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 5000)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to update email")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Profile summary */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{initialEmail}</p>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${getRoleBadgeClass(role)}`}>
            {getRoleLabel(role)}
          </Badge>
        </div>

        <div className="border-t border-border" />

        {/* Change email form */}
        <form onSubmit={handleSaveEmail} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email Address</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A verification link will be sent to the new address before the change takes effect.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <p className="text-sm text-emerald-600">
              Verification email sent. Check your inbox to confirm the change.
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={saving || email.trim().toLowerCase() === initialEmail.toLowerCase()}
          >
            {saving ? "Saving…" : "Update Email"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          Name changes require admin action — contact your clinic admin to update your display name.
        </p>
      </CardContent>
    </Card>
  )
}
