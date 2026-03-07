"use client"

import type { PatientDetail, PrescriptionItem } from "@/types"

// ── Shared constants ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

export const CONDITION_LABELS: Record<string, string> = {
  diabetes: "سكري",
  hypertension: "ضغط",
  cardiac: "قلب",
  thyroid: "غدة درقية",
  other: "مزمن",
}

export const CONDITION_COLORS: Record<string, string> = {
  diabetes: "bg-amber-100 text-amber-800 border-amber-200",
  hypertension: "bg-red-100 text-red-800 border-red-200",
  cardiac: "bg-rose-100 text-rose-800 border-rose-200",
  thyroid: "bg-violet-100 text-violet-800 border-violet-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  })
}

function parseCurrentMeds(prescription: string | null): string[] {
  if (!prescription) return []
  try {
    const items = JSON.parse(prescription) as PrescriptionItem[]
    return items.map((p) => p.drug).filter(Boolean)
  } catch {
    return []
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MedicalSnapshotPanelProps {
  patient: PatientDetail
  /** When true, hides the avatar + name header (used inside mobile banner where header is already shown) */
  compact?: boolean
}

export function MedicalSnapshotPanel({ patient, compact = false }: MedicalSnapshotPanelProps) {
  const initials = getInitials(patient.name)
  const avatarColor = getAvatarColor(patient.id)
  const currentMeds = parseCurrentMeds(patient.records[0]?.prescription ?? null)
  const lastVisit = patient.lastVisitDate ? formatDate(patient.lastVisitDate) : null

  const genderLabel = patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : null

  return (
    <div className="p-4 space-y-5" dir="rtl">

      {/* Avatar + Name + Phone */}
      {!compact && (
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div
            className={`w-16 h-16 rounded-full ${avatarColor} flex items-center justify-center text-white text-xl font-bold`}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{patient.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{patient.phone}</p>
          </div>
        </div>
      )}

      {/* Demographics row */}
      <div className="flex flex-wrap gap-2">
        {patient.age && (
          <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">
            {patient.age} سنة
          </span>
        )}
        {genderLabel && (
          <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">
            {genderLabel}
          </span>
        )}
        {patient.bloodType && (
          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md font-bold">
            {patient.bloodType}
          </span>
        )}
      </div>

      {/* Chronic conditions */}
      <section>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          الأمراض المزمنة
        </p>
        {patient.conditions.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد أمراض مزمنة</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {patient.conditions.map((c) => (
              <span
                key={c.id}
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  CONDITION_COLORS[c.type] ?? CONDITION_COLORS.other
                }`}
              >
                {CONDITION_LABELS[c.type] ?? c.type}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Allergies — highlighted in amber if present */}
      <section>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          الحساسية
        </p>
        {patient.allergies ? (
          <div className="bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
            <div className="flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-medium text-amber-800">{patient.allergies}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لا توجد حساسية مسجلة</p>
        )}
      </section>

      {/* Current medications (from most recent prescription) */}
      <section>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          الأدوية الحالية
        </p>
        {currentMeds.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد أدوية مسجلة</p>
        ) : (
          <ul className="space-y-1">
            {currentMeds.map((drug, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {drug}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Last visit */}
      <section>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          آخر زيارة
        </p>
        <p className="text-xs font-medium">
          {lastVisit ?? "لا توجد زيارات بعد"}
        </p>
      </section>

    </div>
  )
}
