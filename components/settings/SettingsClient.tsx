"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Building2, Phone, MapPin, Banknote, Users, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DoctorManagement } from "@/components/settings/DoctorManagement"
import { ClinicHours } from "@/components/settings/ClinicHours"
import { SubscriptionCard } from "@/components/settings/SubscriptionCard"
import { CreditUsage } from "@/components/settings/CreditUsage"
import { AccountSection } from "@/components/settings/AccountSection"

type ClinicData = {
  id: string
  name: string
  address: string | null
  phone: string | null
  defaultFee: number
  isMultiDoctor: boolean
  subscriptionTier: string
  openingHours: string | null
}

type DoctorRow = {
  id: string
  name: string
  specialty: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

type CurrentDoctor = {
  name: string
  email: string
  role: string
}

type Props = {
  currentRole: string
  currentDoctor: CurrentDoctor
  clinic: ClinicData
  doctors: DoctorRow[]
}

export function SettingsClient({ currentRole, currentDoctor, clinic: initialClinic, doctors }: Props) {
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const isAdmin = currentRole === "admin" || currentRole === "owner"

  // Clinic profile form state (admin only)
  const [clinic, setClinic] = useState(initialClinic)
  const [name, setName] = useState(initialClinic.name)
  const [address, setAddress] = useState(initialClinic.address ?? "")
  const [phone, setPhone] = useState(initialClinic.phone ?? "")
  const [defaultFee, setDefaultFee] = useState(String(initialClinic.defaultFee))
  const [isMultiDoctor, setIsMultiDoctor] = useState(initialClinic.isMultiDoctor)

  const [savingClinic, setSavingClinic] = useState(false)
  const [clinicSaved, setClinicSaved] = useState(false)
  const [clinicError, setClinicError] = useState<string | null>(null)

  async function handleSaveClinic(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setClinicError(t("clinicNameRequired"))
      return
    }
    setSavingClinic(true)
    setClinicError(null)
    setClinicSaved(false)
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          defaultFee: parseInt(defaultFee, 10) || initialClinic.defaultFee,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? t("saveFailed"))
      }
      const updated = await res.json()
      setClinic(updated)
      setClinicSaved(true)
      setTimeout(() => setClinicSaved(false), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("saveFailed")
      setClinicError(msg)
      toast.error(msg)
    } finally {
      setSavingClinic(false)
    }
  }

  async function handleToggleMultiDoctor(checked: boolean) {
    setIsMultiDoctor(checked)
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMultiDoctor: checked }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setIsMultiDoctor(!checked) // revert on failure
      toast.error(t("multiDoctorToggleError"))
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? t("pageSubtitleAdmin") : t("pageSubtitleViewer")}
        </p>
      </div>

      {/* ── Section 1: Clinic Profile ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {t("clinicInfoTitle")}
          </CardTitle>
          {!isAdmin && (
            <CardDescription>{t("clinicInfoReadOnly")}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <form onSubmit={handleSaveClinic} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-name">{t("clinicNameLabel")}</Label>
                  <Input
                    id="clinic-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-phone">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {t("clinicPhoneLabel")}
                    </span>
                  </Label>
                  <Input
                    id="clinic-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="clinic-address">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {t("clinicAddressLabel")}
                    </span>
                  </Label>
                  <Input
                    id="clinic-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Cairo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-fee">
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" /> {t("clinicFeeLabel")}
                    </span>
                  </Label>
                  <Input
                    id="clinic-fee"
                    type="number"
                    min={1}
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(e.target.value)}
                  />
                </div>
              </div>

              {clinicError && <p className="text-sm text-destructive">{clinicError}</p>}
              {clinicSaved && (
                <p className="text-sm text-emerald-600">{t("savedSuccessfully")}</p>
              )}

              <Button type="submit" size="sm" disabled={savingClinic}>
                {savingClinic ? tc("saving") : t("saveChanges")}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">{t("readOnlyName")}</span>
                <span className="font-medium">{clinic.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">{t("readOnlyPhone")}</span>
                <span>{clinic.phone ?? "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">{t("readOnlyAddress")}</span>
                <span>{clinic.address ?? "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">{t("readOnlyFee")}</span>
                <span>{clinic.defaultFee.toLocaleString("en-US")} EGP</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Clinic Hours ───────────────────────────────────────── */}
      <ClinicHours isAdmin={isAdmin} openingHoursJson={clinic.openingHours} />

      {/* ── Section 3: Subscription ───────────────────────────────────────── */}
      <SubscriptionCard currentTier={clinic.subscriptionTier} />

      {/* ── Section 4: WhatsApp Credit Usage ─────────────────────────────── */}
      <CreditUsage subscriptionTier={clinic.subscriptionTier} />

      {/* ── Section 5: Account ───────────────────────────────────────────── */}
      <AccountSection
        name={currentDoctor.name}
        email={currentDoctor.email}
        role={currentDoctor.role}
      />

      {/* ── Section 6: Team Management (admin only) ──────────────────────── */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t("teamTitle")}
            </CardTitle>
            <CardDescription>
              {t("teamDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Multi-doctor toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t("multiDoctorTitle")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isMultiDoctor
                    ? t("multiDoctorActiveDesc")
                    : t("multiDoctorInactiveDesc")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isMultiDoctor}
                onClick={() => handleToggleMultiDoctor(!isMultiDoctor)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isMultiDoctor ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isMultiDoctor ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
                  }`}
                />
              </button>
            </div>

            {isMultiDoctor && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{t("teamMembersTitle")}</h3>
                </div>
                <DoctorManagement initialDoctors={doctors} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
