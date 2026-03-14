"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"
import { PatientRow } from "@/components/patients/PatientRow"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { PatientListItem } from "@/types"

// ── Filter definitions ────────────────────────────────────────────────────────

type FilterKey =
  | "all"
  | "diabetes"
  | "hypertension"
  | "cardiac"
  | "thyroid"
  | "new"
  | "inactive"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "diabetes", label: "سكري" },
  { key: "hypertension", label: "ضغط الدم" },
  { key: "cardiac", label: "أمراض القلب" },
  { key: "thyroid", label: "الغدة الدرقية" },
  { key: "new", label: "مريض جديد" },
  { key: "inactive", label: "غير نشط" },
]

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function applyFilter(patients: PatientListItem[], filter: FilterKey): PatientListItem[] {
  if (filter === "all") return patients

  if (filter === "new") return patients.filter((p) => p.isNew)

  if (filter === "inactive") {
    const cutoff = Date.now() - NINETY_DAYS_MS
    return patients.filter(
      (p) =>
        p.lastVisitDate === null ||
        new Date(p.lastVisitDate).getTime() < cutoff
    )
  }

  // Chronic condition filters
  return patients.filter((p) =>
    p.conditions.some((c) => c.type === filter)
  )
}

function applySearch(patients: PatientListItem[], query: string): PatientListItem[] {
  if (!query.trim()) return patients
  const q = query.trim().toLowerCase()
  return patients.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasPatients }: { hasPatients: boolean }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center" dir="rtl">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-base">
          {hasPatients ? "لا توجد نتائج مطابقة" : "لا يوجد مرضى بعد"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {hasPatients
            ? "جرب تغيير كلمة البحث أو الفلتر"
            : "أضف مريضك الأول للبدء"}
        </p>
      </div>
      {!hasPatients && (
        <Button onClick={() => router.push("/patients/new")} className="mt-2">
          إضافة مريض
        </Button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PatientsViewProps {
  patients: PatientListItem[]
}

export function PatientsView({ patients }: PatientsViewProps) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const parentRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const afterFilter = applyFilter(patients, activeFilter)
    return applySearch(afterFilter, search)
  }, [patients, activeFilter, search])

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b">
        <h1 className="text-xl font-bold">المرضى</h1>
        <span className="text-sm text-muted-foreground">
          {patients.length} مريض
        </span>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهاتف…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-b scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
              activeFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Patient list ── */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState hasPatients={patients.length > 0} />
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="border-b border-border"
              >
                <PatientRow patient={filtered[virtualItem.index]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Results count footer (when filtering) ── */}
      {(search || activeFilter !== "all") && filtered.length > 0 && (
        <div className="px-4 py-2 border-t text-xs text-muted-foreground text-center">
          عرض {filtered.length} من {patients.length} مريض
        </div>
      )}
    </div>
  )
}
