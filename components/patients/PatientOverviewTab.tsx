"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import type { PatientDetail, ConditionDetail } from "@/types"
import { CONDITION_LABELS, CONDITION_COLORS } from "@/components/patients/MedicalSnapshotPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITION_TYPES = [
  { value: "diabetes", label: "سكري" },
  { value: "hypertension", label: "ضغط الدم" },
  { value: "cardiac", label: "أمراض القلب" },
  { value: "thyroid", label: "الغدة الدرقية" },
  { value: "other", label: "أخرى" },
]

// ── Inline editable field ─────────────────────────────────────────────────────

function InlineEditField({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string
  value: string | null
  placeholder: string
  onSave: (newValue: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value ?? "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save()
    if (e.key === "Escape") {
      setDraft(value ?? "")
      setEditing(false)
    }
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <div className="flex gap-2 mt-1">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="text-sm h-8"
            dir="rtl"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setDraft(value ?? ""); setEditing(false) }}
            className="h-8 text-xs"
          >
            إلغاء
          </Button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="mt-1 w-full text-right text-sm px-2 py-1.5 rounded-md border border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors min-h-[34px]"
        >
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="text-muted-foreground text-xs">{placeholder}</span>
          )}
        </button>
      )}
    </div>
  )
}

// ── Chronic conditions section ────────────────────────────────────────────────

function ChronicConditionsSection({
  patientId,
  conditions,
  onConditionsUpdate,
}: {
  patientId: string
  conditions: ConditionDetail[]
  onConditionsUpdate: (updated: ConditionDetail[]) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newType, setNewType] = useState("diabetes")
  const [newNotes, setNewNotes] = useState("")
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleAdd() {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, notes: newNotes || null }),
      })
      if (!res.ok) throw new Error()
      const created: ConditionDetail = await res.json()
      onConditionsUpdate([...conditions, created])
      setShowAddForm(false)
      setNewType("diabetes")
      setNewNotes("")
    } catch {
      toast.error("تعذّر إضافة الحالة المزمنة")
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(conditionId: string) {
    if (removingId) return
    setRemovingId(conditionId)
    try {
      const res = await fetch(`/api/patients/${patientId}/conditions/${conditionId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      onConditionsUpdate(conditions.filter((c) => c.id !== conditionId))
    } catch {
      toast.error("تعذّر حذف الحالة المزمنة")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs text-muted-foreground">الأمراض المزمنة</Label>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs text-primary hover:underline"
          >
            + إضافة حالة
          </button>
        )}
      </div>

      {/* Existing conditions */}
      <div className="flex flex-wrap gap-2 mb-2">
        {conditions.length === 0 && !showAddForm && (
          <p className="text-xs text-muted-foreground">لا توجد أمراض مزمنة مسجلة</p>
        )}
        {conditions.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
              CONDITION_COLORS[c.type] ?? CONDITION_COLORS.other
            }`}
          >
            <span>{CONDITION_LABELS[c.type] ?? c.type}</span>
            <button
              onClick={() => handleRemove(c.id)}
              disabled={removingId === c.id}
              className="hover:opacity-70 transition-opacity disabled:opacity-40 -ml-0.5"
              aria-label="حذف"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="border rounded-md p-3 bg-muted/30 space-y-2">
          <div>
            <Label className="text-xs mb-1 block">نوع الحالة</Label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              dir="rtl"
            >
              {CONDITION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">ملاحظات (اختياري)</Label>
            <Input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="مثال: Type 2 منذ 2014"
              className="text-sm h-8"
              dir="rtl"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding} className="h-7 text-xs">
              {adding ? "جاري الحفظ…" : "حفظ"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowAddForm(false); setNewType("diabetes"); setNewNotes("") }}
              className="h-7 text-xs"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PatientOverviewTabProps {
  patient: PatientDetail
  patientId: string
  onPatientUpdate: (updates: Partial<PatientDetail>) => void
  onConditionsUpdate: (conditions: ConditionDetail[]) => void
}

export function PatientOverviewTab({
  patient,
  patientId,
  onPatientUpdate,
  onConditionsUpdate,
}: PatientOverviewTabProps) {

  // ── Alert banner logic ─────────────────────────────────────────────────────
  const hasChronicConditions = patient.conditions.length > 0
  const daysSinceLastVisit = patient.lastVisitDate
    ? Math.floor((Date.now() - new Date(patient.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const showAlert = hasChronicConditions && daysSinceLastVisit !== null && daysSinceLastVisit > 30

  // ── Mutation helpers ───────────────────────────────────────────────────────
  async function saveAllergies(value: string) {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergies: value }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onPatientUpdate({ allergies: data.allergies })
    } catch {
      toast.error("تعذّر حفظ معلومات الحساسية")
    }
  }

  async function savePermanentNotes(value: string) {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permanentNotes: value }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onPatientUpdate({ permanentNotes: data.permanentNotes })
    } catch {
      toast.error("تعذّر حفظ الملاحظات الدائمة")
    }
  }

  // ── Formatted last visit ───────────────────────────────────────────────────
  const lastVisitFormatted = patient.lastVisitDate
    ? new Date(patient.lastVisitDate).toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Cairo",
      })
    : "لا توجد زيارات"

  return (
    <div className="p-4 space-y-6 max-w-2xl" dir="rtl">

      {/* ── Alert banner ── */}
      {showAlert && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-800">
            آخر زيارة منذ <strong>{daysSinceLastVisit} يوم</strong> — فكر في إرسال تذكير متابعة.
          </p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{patient.totalVisits}</p>
          <p className="text-xs text-muted-foreground mt-0.5">إجمالي الزيارات</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{patient.totalSpent.toLocaleString("ar-EG")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">إجمالي المدفوع (ج.م)</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-sm font-semibold leading-snug">{lastVisitFormatted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">آخر زيارة</p>
        </div>
      </div>

      {/* ── Chronic conditions ── */}
      <ChronicConditionsSection
        patientId={patientId}
        conditions={patient.conditions}
        onConditionsUpdate={onConditionsUpdate}
      />

      {/* ── Allergies (inline edit) ── */}
      <InlineEditField
        label="الحساسية"
        value={patient.allergies}
        placeholder="اضغط لتسجيل الحساسية…"
        onSave={saveAllergies}
      />

      {/* ── Permanent notes (inline edit) ── */}
      <InlineEditField
        label="ملاحظات دائمة"
        value={patient.permanentNotes}
        placeholder="اضغط لإضافة ملاحظات دائمة…"
        onSave={savePermanentNotes}
      />

      {/* ── WhatsApp follow-up button (disabled — Phase 5) ── */}
      <div>
        <button
          disabled
          title="متاح في المرحلة الخامسة"
          className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          إرسال متابعة على واتساب
          <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
            المرحلة 5
          </span>
        </button>
      </div>

    </div>
  )
}
