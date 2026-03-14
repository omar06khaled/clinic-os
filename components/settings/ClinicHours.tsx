"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DayKey =
  | "saturday"
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"

type DaySchedule = { open: boolean; from: string; to: string }
type Hours = Record<DayKey, DaySchedule>

const DAYS: { key: DayKey; en: string; ar: string }[] = [
  { key: "saturday",  en: "Saturday",  ar: "السبت" },
  { key: "sunday",    en: "Sunday",    ar: "الأحد" },
  { key: "monday",    en: "Monday",    ar: "الإثنين" },
  { key: "tuesday",   en: "Tuesday",   ar: "الثلاثاء" },
  { key: "wednesday", en: "Wednesday", ar: "الأربعاء" },
  { key: "thursday",  en: "Thursday",  ar: "الخميس" },
  { key: "friday",    en: "Friday",    ar: "الجمعة" },
]

const DEFAULT_HOURS: Hours = {
  saturday:  { open: true,  from: "09:00", to: "21:00" },
  sunday:    { open: true,  from: "09:00", to: "21:00" },
  monday:    { open: true,  from: "09:00", to: "21:00" },
  tuesday:   { open: true,  from: "09:00", to: "21:00" },
  wednesday: { open: true,  from: "09:00", to: "21:00" },
  thursday:  { open: true,  from: "09:00", to: "21:00" },
  friday:    { open: false, from: "09:00", to: "21:00" },
}

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 6; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`)
    if (h < 23) slots.push(`${String(h).padStart(2, "0")}:30`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

type Props = {
  isAdmin: boolean
  openingHoursJson: string | null
}

export function ClinicHours({ isAdmin, openingHoursJson }: Props) {
  const parsed: Hours = openingHoursJson
    ? { ...DEFAULT_HOURS, ...(JSON.parse(openingHoursJson) as Partial<Hours>) }
    : DEFAULT_HOURS

  const [hours, setHours] = useState<Hours>(parsed)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(day: DayKey) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }))
  }

  function setFrom(day: DayKey, value: string) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], from: value } }))
  }

  function setTo(day: DayKey, value: string) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], to: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch("/api/settings/clinic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingHours: JSON.stringify(hours) }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Clinic Hours
        </CardTitle>
        {!isAdmin && (
          <CardDescription>Only admins can edit clinic hours.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {DAYS.map(({ key, en, ar }) => {
          const day = hours[key]
          return (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 overflow-hidden"
            >
              {/* Top line: toggle + day name */}
              <div className="flex items-center gap-3">
                {/* Open/Closed toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={day.open}
                  disabled={!isAdmin}
                  onClick={() => isAdmin && toggleDay(key)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed ${
                    day.open ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      day.open ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>

                {/* Day name */}
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium">{en}</p>
                  <p className="text-xs text-muted-foreground">{ar}</p>
                </div>
              </div>

              {/* Bottom line: time selectors or Closed */}
              {day.open ? (
                <div className="flex items-center gap-1 min-w-0 w-full">
                  <Select
                    value={day.from}
                    onValueChange={(v) => setFrom(key, v)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 flex-1 min-w-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="px-1 shrink-0 text-xs text-muted-foreground">–</span>
                  <Select
                    value={day.to}
                    onValueChange={(v) => setTo(key, v)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 flex-1 min-w-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Closed</span>
              )}
            </div>
          )
        })}

        {isAdmin && (
          <div className="pt-2 flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Hours"}
            </Button>
            {saved && <p className="text-sm text-emerald-600">Saved successfully.</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
