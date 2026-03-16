"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import { ArrowRight, Loader2, Phone, Search, User, UserPlus } from "lucide-react"
import {
  searchPatients,
  createAppointment,
  createNewPatientAndAppointment,
} from "@/app/(dashboard)/appointments/actions"

// ── Types ─────────────────────────────────────────────────────────────────────

type PatientResult = { id: string; name: string; phone: string }

// ── Component ─────────────────────────────────────────────────────────────────

interface AddAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fill date from the currently viewed day/week */
  defaultDate: string // YYYY-MM-DD
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
}: AddAppointmentDialogProps) {
  const t = useTranslations("appointments")
  const [isSearchPending, startSearchTransition] = useTransition()
  const [isSubmitPending, startSubmitTransition] = useTransition()

  // Patient search
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PatientResult[]>([])
  const [selected, setSelected] = useState<PatientResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  // New patient mode
  const [newPatientMode, setNewPatientMode] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")

  // Form fields
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState("09:00")
  const [visitType, setVisitType] = useState("followup")
  const [complaint, setComplaint] = useState("")

  // ── Derived ───────────────────────────────────────────────────────────────

  const noResultsVisible =
    showResults &&
    !isSearchPending &&
    query.trim().length >= 2 &&
    results.length === 0

  const canSubmit = (() => {
    if (!date || !time) return false
    if (selected) return true
    if (newPatientMode)
      return newName.trim().length >= 2 && newPhone.trim().length >= 7
    return false
  })()

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleQueryChange(q: string) {
    setQuery(q)
    setSelected(null)
    setShowResults(true)
    setNewPatientMode(false)

    if (q.trim().length < 2) {
      setResults([])
      return
    }

    startSearchTransition(async () => {
      const data = await searchPatients(q)
      setResults(data)
    })
  }

  function handleSelectPatient(p: PatientResult) {
    setSelected(p)
    setQuery(p.name)
    setResults([])
    setShowResults(false)
    setNewPatientMode(false)
  }

  function handleEnterNewPatientMode() {
    setNewName(query.trim())
    setNewPhone("")
    setNewPatientMode(true)
    setShowResults(false)
    setResults([])
    setSelected(null)
  }

  function handleBackToSearch() {
    setNewPatientMode(false)
    setNewName("")
    setNewPhone("")
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  function handleChipToggle(chip: string) {
    setComplaint((prev) => (prev === chip ? "" : chip))
  }

  function handleSubmit() {
    if (!canSubmit) return
    startSubmitTransition(async () => {
      if (selected) {
        await createAppointment({
          patientId: selected.id,
          scheduledAt: `${date}T${time}:00+02:00`,
          visitType,
          complaint,
        })
      } else {
        await createNewPatientAndAppointment({
          patientName: newName.trim(),
          patientPhone: newPhone.trim(),
          scheduledAt: `${date}T${time}:00+02:00`,
          visitType,
          complaint,
        })
      }
      handleClose()
    })
  }

  function handleClose() {
    onOpenChange(false)
    setQuery("")
    setResults([])
    setSelected(null)
    setShowResults(false)
    setNewPatientMode(false)
    setNewName("")
    setNewPhone("")
    setDate(defaultDate)
    setTime("09:00")
    setVisitType("followup")
    setComplaint("")
  }

  // ── Complaint chips (defined here so t() is in scope) ─────────────────────

  const COMPLAINT_CHIPS = [
    t("chipFollowupPeriodic"),
    t("chipFever"),
    t("chipHeadache"),
    t("chipAbdominalPain"),
    t("chipCough"),
    t("chipShortnessOfBreath"),
    t("chipJointPain"),
    t("chipDizziness"),
    t("chipNausea"),
    t("chipHighBP"),
    t("chipReviewResults"),
    t("chipDiabetes"),
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* ── Patient section ──────────────────────────────────────────── */}
          {!newPatientMode ? (
            <div className="space-y-1.5">
              <Label>{t("patientLabel")}</Label>

              {selected ? (
                /* Selected patient pill */
                <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                  <User className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-primary truncate">
                      {selected.name}
                    </span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {selected.phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null)
                      setQuery("")
                      setResults([])
                      setShowResults(false)
                    }}
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("changeButton")}
                  </button>
                </div>
              ) : (
                <>
                  {/* Search input */}
                  <div className="relative">
                    {isSearchPending ? (
                      <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground animate-spin pointer-events-none" />
                    ) : (
                      <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    )}
                    <Input
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onFocus={() => results.length > 0 && setShowResults(true)}
                      placeholder={t("searchPlaceholder")}
                      className="pr-8"
                      autoComplete="off"
                    />
                  </div>

                  {/* Results dropdown */}
                  {showResults && results.length > 0 && (
                    <div className="rounded-md border bg-popover shadow-md overflow-hidden">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => handleSelectPatient(p)}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-start"
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col items-start min-w-0">
                            <span className="font-medium truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">
                              {p.phone}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results + add new patient */}
                  {noResultsVisible && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground px-1">
                        {t("noResults")}
                      </p>
                      <button
                        type="button"
                        onMouseDown={handleEnterNewPatientMode}
                        className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t("addNewPatient", { query: query.trim() })}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ── New patient form ─────────────────────────────────────────── */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("newPatientLabel")}</Label>
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="h-3 w-3" />
                  {t("backToSearch")}
                </button>
              </div>

              <div className="rounded-md border border-dashed bg-muted/30 p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("fullNameLabel")}</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("phoneLabel")}</Label>
                  <div className="relative">
                    <Phone className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      dir="ltr"
                      className="pr-8 text-left"
                      type="tel"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Date + Time ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("dateLabel")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("timeLabel")}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          {/* ── Visit type ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>{t("visitTypeLabel")}</Label>
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{t("visitTypeNew")}</SelectItem>
                <SelectItem value="followup">{t("visitTypeFollowup")}</SelectItem>
                <SelectItem value="chronic">{t("visitTypeChronic")}</SelectItem>
                <SelectItem value="urgent">{t("visitTypeUrgent")}</SelectItem>
                <SelectItem value="walkin">{t("visitTypeWalkin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Complaint ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label>
              {t("complaintLabel")}{" "}
              <span className="text-xs text-muted-foreground">{t("complaintOptional")}</span>
            </Label>

            {/* Quick-select chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMPLAINT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipToggle(chip)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    complaint === chip
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Free-text input (stays in sync with chips) */}
            <Input
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder={t("complaintPlaceholder")}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitPending || !canSubmit}
            className={cn(isSubmitPending && "opacity-70")}
          >
            {isSubmitPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("saving")}
              </span>
            ) : (
              t("saveButton")
            )}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitPending}>
            {t("cancelButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
