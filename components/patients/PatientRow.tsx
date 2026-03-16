"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { PatientListItem } from "@/types"

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

// ── Condition colors ───────────────────────────────────────────────────────────

const CONDITION_COLORS: Record<string, string> = {
  diabetes: "bg-amber-100 text-amber-800",
  hypertension: "bg-rose-100 text-rose-800",
  cardiac: "bg-red-100 text-red-800",
  thyroid: "bg-violet-100 text-violet-800",
  other: "bg-gray-100 text-gray-700",
}

// Translation key map for condition labels
const CONDITION_LABEL_KEYS: Record<string, string> = {
  diabetes: "conditionDiabetes",
  hypertension: "conditionHypertension",
  cardiac: "conditionCardiac",
  thyroid: "conditionThyroid",
  other: "conditionOther",
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatLastVisit(isoDate: string | null): string | null {
  if (!isoDate) return null
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PatientRowProps {
  patient: PatientListItem
}

export function PatientRow({ patient }: PatientRowProps) {
  const router = useRouter()
  const t = useTranslations("patients")
  const initials = getInitials(patient.name)
  const avatarColor = getAvatarColor(patient.id)

  // Show first non-"other" condition; fall back to first condition if all are "other"
  const primaryCondition =
    patient.conditions.find((c) => c.type !== "other") ??
    patient.conditions[0] ??
    null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/patients/${patient.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/patients/${patient.id}`)
        }
      }}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold`}
      >
        {initials}
      </div>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{patient.name}</span>
          {patient.isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">
              {t("newBadge")}
            </span>
          )}
          {primaryCondition && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                CONDITION_COLORS[primaryCondition.type] ??
                CONDITION_COLORS.other
              }`}
            >
              {t(CONDITION_LABEL_KEYS[primaryCondition.type] ?? CONDITION_LABEL_KEYS.other)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{patient.phone}</p>
      </div>

      {/* Last visit + next visit */}
      <div className="hidden sm:block text-start min-w-[110px]">
        <p className="text-xs text-muted-foreground">{t("lastVisitLabel")}</p>
        <p className="text-xs font-medium">
          {formatLastVisit(patient.lastVisitDate) ?? t("noVisits")}
        </p>
        {patient.nextVisitDate && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatLastVisit(patient.nextVisitDate)}
          </p>
        )}
      </div>

      {/* Total visits */}
      <div className="hidden md:block text-start min-w-[60px]">
        <p className="text-xs text-muted-foreground">{t("totalVisitsLabel")}</p>
        <p className="text-xs font-medium">{patient.totalVisits}</p>
      </div>

      {/* Outstanding balance */}
      <div className="text-start min-w-[80px]">
        <p className="text-xs text-muted-foreground">{t("balanceLabel")}</p>
        <p
          className={`text-xs font-semibold ${
            patient.outstandingBalance > 0 ? "text-rose-600" : "text-gray-500"
          }`}
        >
          {patient.outstandingBalance > 0
            ? `${patient.outstandingBalance.toLocaleString("ar-EG")} ج.م`
            : t("balanceZero")}
        </p>
      </div>

      {/* Chevron */}
      <svg
        className="flex-shrink-0 w-4 h-4 text-muted-foreground rotate-180"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  )
}
