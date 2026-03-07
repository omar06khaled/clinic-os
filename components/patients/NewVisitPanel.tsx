"use client"

// Phase 7 will upgrade voice note transcription to OpenAI Whisper for Arabic support.
// Supabase Storage upload is stubbed — wire up bucket in Phase 7.

import { useState, useRef, useEffect, useCallback } from "react"
import type { VisitRecordDetail } from "@/types"
import { DRUGS, type DrugEntry } from "@/lib/drugs"

// ── Constants ─────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  "مرة يومياً",
  "مرتين يومياً",
  "ثلاث مرات يومياً",
  "أربع مرات يومياً",
  "عند الحاجة",
  "أخرى",
] as const

const COMPLAINT_CHIPS = ["كشف عام", "متابعة", "استشارة", "طوارئ", "أخرى"]

const SYMPTOM_OPTIONS = [
  "صداع",
  "حمى",
  "سعال",
  "إرهاق",
  "ألم صدري",
  "ضيق التنفس",
  "غثيان",
  "ألم",
  "أخرى",
]

// ── Local types ───────────────────────────────────────────────────────────────

type PrescriptionRow = {
  id: string
  drug: string
  dose: string
  frequency: string
  duration: string
}

type LabRow = {
  id: string
  test: string
  labName: string
  notes: string
  received: boolean
}

type LabRecord = {
  id: string
  name: string
  address: string | null
  phone: string | null
}

type AttachmentPreview = {
  id: string
  file: File
  previewUrl: string | null
  uploading: boolean
}

type Toast = { type: "success" | "error"; message: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function emptyPrescriptionRow(): PrescriptionRow {
  return { id: uid(), drug: "", dose: "", frequency: "مرة يومياً", duration: "" }
}

function emptyLabRow(): LabRow {
  return { id: uid(), test: "", labName: "", notes: "", received: false }
}

function todayDisplay() {
  return new Date().toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function InputBase({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${className}`}
    />
  )
}

function TextareaBase({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none ${className}`}
    />
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface NewVisitPanelProps {
  patientId: string
  patientName: string
  onClose: () => void
  onVisitSaved: (record: VisitRecordDetail) => void
}

// ── Main component ────────────────────────────────────────────────────────────

export function NewVisitPanel({ patientId, patientName, onClose, onVisitSaved }: NewVisitPanelProps) {

  // ── Form state ──────────────────────────────────────────────────────────────
  const [complaint, setComplaint]           = useState("")
  const [vitalsBP, setVitalsBP]             = useState("")
  const [vitalsPulse, setVitalsPulse]       = useState("")
  const [vitalsTemp, setVitalsTemp]         = useState("")
  const [vitalsWeight, setVitalsWeight]     = useState("")
  const [vitalsO2, setVitalsO2]             = useState("")
  const [symptoms, setSymptoms]             = useState<string[]>([])
  const [customSymptom, setCustomSymptom]   = useState("")
  const [diagnosis, setDiagnosis]           = useState("")
  const [rxRows, setRxRows]                 = useState<PrescriptionRow[]>([emptyPrescriptionRow()])
  const [labRows, setLabRows]               = useState<LabRow[]>([emptyLabRow()])
  const [followUpDays, setFollowUpDays]     = useState("")
  const [followUpReason, setFollowUpReason] = useState("")
  const [doctorNotes, setDoctorNotes]       = useState("")
  const [attachments, setAttachments]       = useState<AttachmentPreview[]>([])

  // ── Drug autocomplete ────────────────────────────────────────────────────────
  const [focusedRxId, setFocusedRxId] = useState<string | null>(null)

  // ── Labs ─────────────────────────────────────────────────────────────────────
  const [labs, setLabs]                   = useState<LabRecord[]>([])
  const [openLabDropdownId, setOpenLabDropdownId] = useState<string | null>(null)
  const [addLabForRowId, setAddLabForRowId]       = useState<string | null>(null)
  const [newLabName, setNewLabName]               = useState("")
  const [newLabAddress, setNewLabAddress]         = useState("")
  const [newLabPhone, setNewLabPhone]             = useState("")
  const [savingLab, setSavingLab]                 = useState(false)

  // ── Voice note ───────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast]       = useState<Toast | null>(null)

  // ── Fetch labs on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/labs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLabs(data) })
      .catch(() => {})
  }, [])

  // ── Cleanup voice on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Drug autocomplete ─────────────────────────────────────────────────────────
  const focusedRxRow = rxRows.find((r) => r.id === focusedRxId)
  const drugMatches: DrugEntry[] =
    focusedRxRow && focusedRxRow.drug.length >= 3
      ? DRUGS.filter((d) =>
          d.name.toLowerCase().includes(focusedRxRow.drug.toLowerCase())
        ).slice(0, 8)
      : []

  function updateRxRow(id: string, patch: Partial<PrescriptionRow>) {
    setRxRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function selectDrug(rowId: string, drug: DrugEntry) {
    setRxRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, drug: drug.name, dose: drug.defaultDose, frequency: drug.defaultFrequency, duration: drug.defaultDuration }
          : r
      )
    )
    setFocusedRxId(null)
  }

  function addRxRow() {
    setRxRows((prev) => [...prev, emptyPrescriptionRow()])
  }

  function removeRxRow(id: string) {
    setRxRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  // ── Lab helpers ───────────────────────────────────────────────────────────────
  function updateLabRow(id: string, patch: Partial<LabRow>) {
    setLabRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addLabRow() {
    setLabRows((prev) => [...prev, emptyLabRow()])
  }

  function removeLabRow(id: string) {
    setLabRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  async function handleSaveLab() {
    if (!newLabName.trim() || !addLabForRowId) return
    setSavingLab(true)
    try {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLabName.trim(), address: newLabAddress.trim() || null, phone: newLabPhone.trim() || null }),
      })
      if (!res.ok) throw new Error()
      const newLab: LabRecord = await res.json()
      setLabs((prev) => [...prev, newLab].sort((a, b) => a.name.localeCompare(b.name)))
      updateLabRow(addLabForRowId, { labName: newLab.name })
      setAddLabForRowId(null)
      setNewLabName("")
      setNewLabAddress("")
      setNewLabPhone("")
    } catch {
      showToast("error", "فشل حفظ المعمل")
    } finally {
      setSavingLab(false)
    }
  }

  // ── Symptoms ──────────────────────────────────────────────────────────────────
  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  // ── Voice note ────────────────────────────────────────────────────────────────
  function handleVoiceNote() {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsRecording(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      showToast("error", "الملاحظات الصوتية تتطلب Chrome على سطح المكتب")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "ar-EG"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ")
      setDoctorNotes((prev) => (prev.trim() ? prev.trim() + " " + transcript : transcript))
    }

    recognition.onerror = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  // ── File attachments (UI only — upload stubbed for Phase 7) ──────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    // Reset input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = ""

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("error", `${file.name}: الحجم يتجاوز 10 ميجابايت`)
        continue
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      const localId = uid()

      setAttachments((prev) => [
        ...prev,
        { id: localId, file, previewUrl, uploading: false },
      ])

      // Supabase Storage upload — wire up bucket in Phase 7
      // uploadToStorage({ doctorId, patientId, recordId, file })
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id)
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true)
    try {
      // Build symptoms array: include "أخرى" label as-is if no custom text;
      // if custom text provided, replace "أخرى" with the actual custom value.
      const symptomsArr = symptoms.filter((s) => s !== "أخرى")
      if (symptoms.includes("أخرى") && customSymptom.trim()) {
        symptomsArr.push(customSymptom.trim())
      } else if (symptoms.includes("أخرى")) {
        symptomsArr.push("أخرى")
      }

      const validRx = rxRows.filter((r) => r.drug.trim())
      const validLabs = labRows.filter((r) => r.test.trim())

      const body = {
        patientId,
        complaint:      complaint.trim()      || null,
        vitalsBP:       vitalsBP.trim()       || null,
        vitalsPulse:    vitalsPulse           ? Number(vitalsPulse)    : null,
        vitalsTemp:     vitalsTemp            ? Number(vitalsTemp)     : null,
        vitalsWeight:   vitalsWeight          ? Number(vitalsWeight)   : null,
        vitalsO2:       vitalsO2              ? Number(vitalsO2)       : null,
        symptoms:       symptomsArr.length > 0 ? JSON.stringify(symptomsArr) : null,
        diagnosis:      diagnosis.trim()      || null,
        prescription:   validRx.length > 0
          ? JSON.stringify(validRx.map(({ drug, dose, frequency, duration }) => ({ drug, dose, frequency, duration })))
          : null,
        labReferrals:   validLabs.length > 0
          ? JSON.stringify(validLabs.map(({ test, labName, notes, received }) => ({ test, lab: labName, notes, received })))
          : null,
        followUpDays:   followUpDays    ? Number(followUpDays)   : null,
        followUpReason: followUpReason.trim() || null,
        doctorNotes:    doctorNotes.trim()    || null,
        voiceNoteText:  null,
      }

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "فشل حفظ الزيارة")
      }

      const newRecord: VisitRecordDetail = await res.json()
      showToast("success", "تم حفظ الزيارة بنجاح")

      // Brief pause so the doctor sees the success toast before the panel closes
      setTimeout(() => {
        onVisitSaved(newRecord)
        onClose()
      }, 900)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "فشل حفظ الزيارة")
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">

      {/* ── Sticky header ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-tight">زيارة جديدة</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {patientName} — {todayDisplay()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          aria-label="إغلاق"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`flex-shrink-0 mx-4 mt-3 px-3 py-2 rounded-md text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Scrollable form body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* 1 — Chief Complaint */}
        <section>
          <SectionHeader label="الشكوى الرئيسية" />
          <TextareaBase
            rows={2}
            placeholder="اكتب الشكوى..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMPLAINT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  setComplaint((prev) => (prev.trim() ? prev.trim() + "، " + chip : chip))
                }
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted hover:bg-muted/70 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* 2 — Vitals */}
        <section>
          <SectionHeader label="العلامات الحيوية" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">ضغط الدم</label>
              <InputBase
                placeholder="120/80"
                value={vitalsBP}
                onChange={(e) => setVitalsBP(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">النبض (نبضة/د)</label>
              <InputBase
                type="number"
                placeholder="75"
                min={0}
                value={vitalsPulse}
                onChange={(e) => setVitalsPulse(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">الحرارة (°C)</label>
              <InputBase
                type="number"
                placeholder="37.0"
                step="0.1"
                min={0}
                value={vitalsTemp}
                onChange={(e) => setVitalsTemp(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">الوزن (كجم)</label>
              <InputBase
                type="number"
                placeholder="70"
                step="0.1"
                min={0}
                value={vitalsWeight}
                onChange={(e) => setVitalsWeight(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] text-muted-foreground mb-1">تشبع الأكسجين (%)</label>
              <InputBase
                type="number"
                placeholder="98"
                min={0}
                max={100}
                value={vitalsO2}
                onChange={(e) => setVitalsO2(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 3 — Symptoms */}
        <section>
          <SectionHeader label="الأعراض" />
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOM_OPTIONS.map((s) => {
              const active = symptoms.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-muted/70"
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
          {symptoms.includes("أخرى") && (
            <InputBase
              className="mt-2"
              placeholder="اكتب العرض هنا..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
            />
          )}
        </section>

        {/* 4 — Diagnosis */}
        <section>
          <SectionHeader label="التشخيص" />
          <TextareaBase
            rows={2}
            placeholder="التشخيص..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </section>

        {/* 5 — Prescription */}
        <section>
          <SectionHeader label="الوصفة الطبية" />
          <div className="space-y-3">
            {rxRows.map((row) => {
              const showDropdown = focusedRxId === row.id && drugMatches.length > 0
              return (
                <div key={row.id} className="border rounded-md p-3 bg-muted/20 space-y-2">

                    {/* Remove row */}
                    {rxRows.length > 1 && (
                      <div className="flex justify-start mb-1">
                        <button
                          type="button"
                          onClick={() => removeRxRow(row.id)}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    )}

                  {/* Drug name with autocomplete */}
                  <div className="relative">
                    <label className="block text-[11px] text-muted-foreground mb-1">اسم الدواء</label>
                    <InputBase
                      className="pr-8"
                      placeholder="ابدأ بالكتابة (3 أحرف على الأقل)..."
                      value={row.drug}
                      onChange={(e) => updateRxRow(row.id, { drug: e.target.value })}
                      onFocus={() => setFocusedRxId(row.id)}
                      onBlur={() => {
                        // Delay so onMouseDown on dropdown items fires first
                        setTimeout(() => setFocusedRxId(null), 150)
                      }}
                      autoComplete="off"
                    />
                    {showDropdown && (
                      <div className="absolute z-20 top-full mt-1 right-0 left-0 bg-background border rounded-md shadow-md max-h-44 overflow-y-auto">
                        {drugMatches.map((drug) => (
                          <button
                            key={drug.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault() // prevent blur before click
                              selectDrug(row.id, drug)
                            }}
                            className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors"
                          >
                            <span className="font-medium">{drug.name}</span>
                            <span className="text-muted-foreground text-xs"> — {drug.defaultDose}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dose + Frequency + Duration */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">الجرعة</label>
                      <InputBase
                        placeholder="مثال: 500mg"
                        value={row.dose}
                        onChange={(e) => updateRxRow(row.id, { dose: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">التكرار</label>
                      <select
                        value={row.frequency}
                        onChange={(e) => updateRxRow(row.id, { frequency: e.target.value })}
                        className="w-full border rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {FREQUENCY_OPTIONS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">المدة</label>
                      <InputBase
                        placeholder="مثال: 7 أيام"
                        value={row.duration}
                        onChange={(e) => updateRxRow(row.id, { duration: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addRxRow}
            className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة دواء
          </button>
        </section>

        {/* 6 — Lab Referrals */}
        <section>
          <SectionHeader label="طلبات المختبر" />
          <div className="space-y-3">
            {labRows.map((row) => (
              <div key={row.id} className="border rounded-md p-3 bg-muted/20 space-y-2">

                    {/* Remove row */}
                    {labRows.length > 1 && (
                      <div className="flex justify-start mb-1">
                        <button
                          type="button"
                          onClick={() => removeLabRow(row.id)}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    )}

                {/* Test name */}
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">اسم التحليل</label>
                  <InputBase
                    placeholder="مثال: CBC، HbA1c، TSH..."
                    value={row.test}
                    onChange={(e) => updateLabRow(row.id, { test: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Lab dropdown */}
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">المعمل</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenLabDropdownId(openLabDropdownId === row.id ? null : row.id)
                        }
                        className="w-full flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-sm bg-background text-right hover:bg-muted/30 transition-colors"
                      >
                        <span className={row.labName ? "" : "text-muted-foreground"}>
                          {row.labName || "اختر معملاً"}
                        </span>
                        <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openLabDropdownId === row.id && (
                        <>
                          {/* Click-outside backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenLabDropdownId(null)}
                          />
                          <div className="absolute z-20 top-full mt-1 right-0 left-0 bg-background border rounded-md shadow-md overflow-hidden max-h-48 overflow-y-auto">
                            {labs.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-muted-foreground">
                                لا يوجد معامل محفوظة
                              </p>
                            ) : (
                              labs.map((lab) => (
                                <button
                                  key={lab.id}
                                  type="button"
                                  onClick={() => {
                                    updateLabRow(row.id, { labName: lab.name })
                                    setOpenLabDropdownId(null)
                                  }}
                                  className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                  {lab.name}
                                </button>
                              ))
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenLabDropdownId(null)
                                setAddLabForRowId(row.id)
                              }}
                              className="w-full text-right px-3 py-2 text-sm text-primary font-medium border-t hover:bg-muted transition-colors"
                            >
                              + إضافة معمل جديد
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">ملاحظات</label>
                    <InputBase
                      placeholder="اختياري"
                      value={row.notes}
                      onChange={(e) => updateLabRow(row.id, { notes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Results received toggle */}
                <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={row.received}
                    onChange={(e) => updateLabRow(row.id, { received: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-muted-foreground text-xs">استُلمت النتائج</span>
                </label>
              </div>
            ))}
          </div>

          {/* Add new lab inline form */}
          {addLabForRowId && (
            <div className="mt-3 border border-primary/30 rounded-md p-3 bg-primary/5 space-y-2">
              <p className="text-xs font-semibold text-primary">إضافة معمل جديد</p>
              <InputBase
                placeholder="اسم المعمل *"
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
              />
              <InputBase
                placeholder="العنوان (اختياري)"
                value={newLabAddress}
                onChange={(e) => setNewLabAddress(e.target.value)}
              />
              <InputBase
                placeholder="رقم الهاتف (اختياري)"
                value={newLabPhone}
                onChange={(e) => setNewLabPhone(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setAddLabForRowId(null); setNewLabName(""); setNewLabAddress(""); setNewLabPhone("") }}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!newLabName.trim() || savingLab}
                  onClick={handleSaveLab}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {savingLab ? "جاري الحفظ..." : "حفظ المعمل"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={addLabRow}
            className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة تحليل
          </button>
        </section>

        {/* 7 — Follow-up */}
        <section>
          <SectionHeader label="خطة المتابعة" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">بعد كم يوم</label>
              <InputBase
                type="number"
                placeholder="مثال: 14"
                min={1}
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">السبب</label>
              <InputBase
                placeholder="مراجعة نتائج..."
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 8 — Doctor's Notes + Voice */}
        <section>
          <SectionHeader label="ملاحظات الطبيب" />
          <TextareaBase
            rows={3}
            placeholder="ملاحظات خاصة..."
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={handleVoiceNote}
            className={`mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-md border transition-colors ${
              isRecording
                ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                : "bg-muted border-border text-foreground hover:bg-muted/70"
            }`}
          >
            <svg
              className={`w-4 h-4 ${isRecording ? "animate-pulse text-red-600" : "text-muted-foreground"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
            {isRecording ? "جاري التسجيل... اضغط للإيقاف" : "تسجيل ملاحظة صوتية"}
          </button>
          <p className="text-[10px] text-muted-foreground mt-1">
            {/* Phase 7 will upgrade this to OpenAI Whisper for Arabic support */}
            يستخدم Web Speech API — Chrome على سطح المكتب مُوصى به
          </p>
        </section>

        {/* 9 — Attachments */}
        <section>
          <SectionHeader label="المرفقات" />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/60 transition-colors"
          >
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            رفع صورة أو ملف PDF (حد 10MB)
          </button>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative w-20 h-20 border rounded-md bg-muted overflow-hidden flex items-center justify-center group"
                >
                  {att.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.previewUrl}
                      alt={att.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-1 text-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[9px] text-muted-foreground leading-tight break-all line-clamp-2">
                        {att.file.name}
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-background/90 border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="حذف المرفق"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Supabase Storage upload — wire up bucket in Phase 7 */}
                  {att.uploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-card">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/60 border-t-primary-foreground rounded-full animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              حفظ سجل الزيارة
            </>
          )}
        </button>
      </div>
    </div>
  )
}
