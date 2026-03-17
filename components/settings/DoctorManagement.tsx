"use client"

import { useState } from "react"
import { UserPlus, UserCheck, UserX, Mail, Stethoscope, ShieldCheck, ConciergeBell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DoctorRow = {
  id: string
  name: string
  specialty: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

type Props = {
  initialDoctors: DoctorRow[]
}

function getRoleBadgeClass(role: string) {
  if (role === "owner")        return "text-xs border-rose-500/40 text-rose-600 bg-rose-50 dark:bg-rose-950/20"
  if (role === "admin")        return "text-xs border-amber-500/40 text-amber-600 bg-amber-50 dark:bg-amber-950/20"
  if (role === "receptionist") return "text-xs border-purple-500/40 text-purple-600 bg-purple-50 dark:bg-purple-950/20"
  return "text-xs border-blue-500/40 text-blue-600 bg-blue-50 dark:bg-blue-950/20"
}

function getRoleLabel(role: string) {
  if (role === "owner")        return "Owner"
  if (role === "admin")        return "Admin"
  if (role === "receptionist") return "Receptionist"
  return "Doctor"
}

function getRoleIcon(role: string) {
  if (role === "owner")        return <ShieldCheck className="h-4 w-4 text-rose-500" />
  if (role === "admin")        return <ShieldCheck className="h-4 w-4 text-muted-foreground" />
  if (role === "receptionist") return <ConciergeBell className="h-4 w-4 text-muted-foreground" />
  return <Stethoscope className="h-4 w-4 text-muted-foreground" />
}

export function DoctorManagement({ initialDoctors }: Props) {
  const [doctors, setDoctors] = useState<DoctorRow[]>(initialDoctors)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"doctor" | "admin" | "receptionist" | "owner">("doctor")

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)
    setSubmitting(true)

    const res = await fetch("/api/settings/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, specialty, email, role }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setFormError(data.error ?? "Something went wrong")
      return
    }

    setDoctors((prev) => [...prev, data])
    setSuccessMsg(`Invite sent to ${email}`)
    setName("")
    setSpecialty("")
    setEmail("")
    setRole("doctor")
    setShowForm(false)
  }

  async function handleToggleActive(doctor: DoctorRow) {
    setTogglingId(doctor.id)
    const res = await fetch("/api/settings/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId: doctor.id, isActive: !doctor.isActive }),
    })
    setTogglingId(null)

    if (res.ok) {
      const updated = await res.json()
      setDoctors((prev) => prev.map((d) => (d.id === updated.id ? { ...d, isActive: updated.isActive } : d)))
    }
  }

  return (
    <div className="space-y-4">
      {/* Team member list */}
      <div className="space-y-2">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                {getRoleIcon(doctor.role)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doctor.name}</p>
                <p className="text-xs text-muted-foreground truncate">{doctor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              {doctor.specialty && (
                <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                  {doctor.specialty}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={getRoleBadgeClass(doctor.role)}
              >
                {getRoleLabel(doctor.role)}
              </Badge>
              <Badge
                variant="outline"
                className={
                  doctor.isActive
                    ? "text-xs border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                    : "text-xs border-red-500/40 text-red-600 bg-red-50 dark:bg-red-950/20"
                }
              >
                {doctor.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={togglingId === doctor.id}
                onClick={() => handleToggleActive(doctor)}
              >
                {doctor.isActive ? (
                  <UserX className="h-3.5 w-3.5" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <Mail className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Add team member button / inline form */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => { setShowForm(true); setSuccessMsg(null) }}
        >
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </Button>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Invite New Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-name">Full Name *</Label>
                  <Input
                    id="inv-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Sarah Ahmed"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-specialty">Specialty</Label>
                  <Input
                    id="inv-specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Cardiology"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-email">Email *</Label>
                  <Input
                    id="inv-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@clinic.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-role">Role *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "doctor" | "admin" | "receptionist" | "owner")}>
                    <SelectTrigger id="inv-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting} className="gap-2">
                  <Mail className="h-4 w-4" />
                  {submitting ? "Sending invite…" : "Send Invite"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowForm(false); setFormError(null) }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
