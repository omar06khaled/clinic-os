"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PatientDetail, ConditionDetail } from "@/types"
import { MedicalSnapshotPanel } from "@/components/patients/MedicalSnapshotPanel"
import { PatientOverviewTab } from "@/components/patients/PatientOverviewTab"
import { VisitHistoryTab } from "@/components/patients/VisitHistoryTab"
import { ChronicTrackingTab } from "@/components/patients/ChronicTrackingTab"

// ── Avatar helpers (shared with PatientRow) ───────────────────────────────────

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

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = "overview" | "visits" | "chronic"
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "نظرة عامة" },
  { id: "visits", label: "سجل الزيارات" },
  { id: "chronic", label: "المتابعة المزمنة" },
]

// ── Mobile snapshot banner ────────────────────────────────────────────────────

function MobileSnapshotBanner({
  patient,
  expanded,
  onToggle,
}: {
  patient: PatientDetail
  expanded: boolean
  onToggle: () => void
}) {
  const initials = getInitials(patient.name)
  const avatarColor = getAvatarColor(patient.id)

  return (
    <div className="border-b bg-card" dir="rtl">
      {/* Always-visible row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-right"
      >
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{patient.name}</p>
          <p className="text-xs text-muted-foreground">{patient.phone}</p>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-4 pb-4">
          <MedicalSnapshotPanel patient={patient} compact />
        </div>
      )}
    </div>
  )
}

// ── Zone 3 placeholder (New Visit panel — Task 3.3) ───────────────────────────

function NewVisitPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-base">زيارة جديدة</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          aria-label="إغلاق"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-medium text-sm">نموذج الزيارة</p>
          <p className="text-xs text-muted-foreground mt-1">قادم في المهمة 3.3</p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PatientProfileViewProps {
  patient: PatientDetail
}

export function PatientProfileView({ patient: initialPatient }: PatientProfileViewProps) {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientDetail>(initialPatient)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [zone3Open, setZone3Open] = useState(false)
  const [zone1MobileOpen, setZone1MobileOpen] = useState(false)

  const hasChronicConditions = patient.conditions.length > 0

  function handlePatientUpdate(updates: Partial<PatientDetail>) {
    setPatient((p) => ({ ...p, ...updates }))
  }

  function handleConditionsUpdate(conditions: ConditionDetail[]) {
    setPatient((p) => ({ ...p, conditions }))
  }

  return (
    // Outer: flex row, fills the main content area height
    // LTR flex ordering so Zone 1 is visually left, Zone 3 visually right
    <div className="flex h-full overflow-hidden">

      {/* ── Zone 1: Desktop left rail (220px, sticky/no-scroll) ────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 border-r bg-card overflow-y-auto">
        <MedicalSnapshotPanel patient={patient} />
      </aside>

      {/* ── Zone 2 + mobile Zone 1 ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile Zone 1 banner */}
        <div className="lg:hidden">
          <MobileSnapshotBanner
            patient={patient}
            expanded={zone1MobileOpen}
            onToggle={() => setZone1MobileOpen((v) => !v)}
          />
        </div>

        {/* Zone 2 header: back button + patient name + New Visit button */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-background"
          dir="rtl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/patients")}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="hidden sm:inline">المرضى</span>
            </button>
            <span className="text-muted-foreground/50 hidden sm:inline">|</span>
            <h1 className="font-semibold text-sm truncate hidden sm:block">{patient.name}</h1>
          </div>

          <button
            onClick={() => setZone3Open(true)}
            className="flex-shrink-0 flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            زيارة جديدة
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b bg-background px-4 gap-1" dir="rtl">
          {TABS.map((tab) => {
            if (tab.id === "chronic" && !hasChronicConditions) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content — only this scrolls */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview" && (
            <PatientOverviewTab
              patient={patient}
              patientId={patient.id}
              onPatientUpdate={handlePatientUpdate}
              onConditionsUpdate={handleConditionsUpdate}
            />
          )}
          {activeTab === "visits" && (
            <VisitHistoryTab
              records={patient.records}
              onNewVisit={() => setZone3Open(true)}
            />
          )}
          {activeTab === "chronic" && hasChronicConditions && (
            <ChronicTrackingTab
              records={patient.records}
              conditions={patient.conditions}
            />
          )}
        </div>
      </div>

      {/* ── Zone 3: Desktop right panel (400px, slides in) ─────────────────── */}
      {zone3Open && (
        <aside className="hidden lg:flex flex-col w-[400px] flex-shrink-0 border-l bg-card overflow-y-auto">
          <NewVisitPanel onClose={() => setZone3Open(false)} />
        </aside>
      )}

      {/* ── Zone 3: Mobile full-screen overlay ─────────────────────────────── */}
      {zone3Open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <NewVisitPanel onClose={() => setZone3Open(false)} />
        </div>
      )}
    </div>
  )
}
