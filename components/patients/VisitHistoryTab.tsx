"use client"

import { useState } from "react"
import type { VisitRecordDetail, PrescriptionItem, LabReferral } from "@/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  })
}

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) as T } catch { return fallback }
}

// ── Payment badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid: { label: "مدفوع", className: "bg-green-100 text-green-800" },
    pending: { label: "معلق", className: "bg-amber-100 text-amber-800" },
    waived: { label: "معفي", className: "bg-gray-100 text-gray-600" },
  }
  const { label, className } = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}

// ── Expanded visit card content ───────────────────────────────────────────────

function ExpandedVisitContent({ record }: { record: VisitRecordDetail }) {
  const symptoms = safeJsonParse<string[]>(record.symptoms, [])
  const prescription = safeJsonParse<PrescriptionItem[]>(record.prescription, [])
  const labReferrals = safeJsonParse<LabReferral[]>(record.labReferrals, [])
  const hasVitals =
    record.vitalsBP || record.vitalsPulse || record.vitalsTemp ||
    record.vitalsWeight || record.vitalsO2

  return (
    <div className="border-t mt-3 pt-3 space-y-4 text-sm">

      {/* Vitals */}
      {hasVitals && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            العلامات الحيوية
          </p>
          <div className="flex flex-wrap gap-2">
            {record.vitalsBP && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">ضغط الدم: </span>
                <span className="font-medium">{record.vitalsBP} mmHg</span>
              </div>
            )}
            {record.vitalsPulse && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">النبض: </span>
                <span className="font-medium">{record.vitalsPulse} نبضة/د</span>
              </div>
            )}
            {record.vitalsTemp && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">الحرارة: </span>
                <span className="font-medium">{record.vitalsTemp}°C</span>
              </div>
            )}
            {record.vitalsWeight && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">الوزن: </span>
                <span className="font-medium">{record.vitalsWeight} كجم</span>
              </div>
            )}
            {record.vitalsO2 && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">O₂: </span>
                <span className="font-medium">{record.vitalsO2}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Symptoms */}
      {symptoms.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            الأعراض
          </p>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map((s, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis */}
      {record.diagnosis && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            التشخيص
          </p>
          <p className="text-sm">{record.diagnosis}</p>
        </div>
      )}

      {/* Prescription */}
      {prescription.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            الوصفة الطبية
          </p>
          <div className="space-y-1.5">
            {prescription.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                <span>
                  <span className="font-semibold">{item.drug}</span>
                  {item.dose && <span className="text-muted-foreground"> — {item.dose}</span>}
                  {item.frequency && <span className="text-muted-foreground"> — {item.frequency}</span>}
                  {item.duration && <span className="text-muted-foreground"> — {item.duration}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab referrals */}
      {labReferrals.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            طلبات المختبر
          </p>
          <div className="space-y-1.5">
            {labReferrals.map((lab, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                  <span className="font-medium">{lab.test}</span>
                  {lab.lab && <span className="text-muted-foreground">— {lab.lab}</span>}
                  {lab.notes && <span className="text-muted-foreground">({lab.notes})</span>}
                </div>
                {lab.received && (
                  <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
                    استُلمت النتائج
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {(record.followUpDays || record.followUpReason) && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            خطة المتابعة
          </p>
          <p className="text-sm">
            {record.followUpDays && <span className="font-medium">{record.followUpDays} يوم</span>}
            {record.followUpDays && record.followUpReason && " — "}
            {record.followUpReason && <span>{record.followUpReason}</span>}
          </p>
        </div>
      )}

      {/* Doctor notes */}
      {record.doctorNotes && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            ملاحظات الطبيب
          </p>
          <p className="text-sm bg-muted/40 rounded-md px-3 py-2">{record.doctorNotes}</p>
        </div>
      )}

      {/* Attachments */}
      {record.attachments.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            المرفقات
          </p>
          <div className="flex gap-2 flex-wrap">
            {record.attachments.map((a) => (
              <div key={a.id} className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground text-center p-1 overflow-hidden">
                {a.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice note (placeholder) */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          ملاحظة صوتية
        </p>
        <button
          disabled
          title="الملاحظات الصوتية قادمة في المرحلة السابعة"
          className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-dashed border-border px-3 py-1.5 rounded-md cursor-not-allowed opacity-60"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          تشغيل الملاحظة الصوتية
          <span className="text-[9px] bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">المرحلة 7</span>
        </button>
      </div>

      {/* Export PDF button (placeholder) */}
      <div className="flex justify-end pt-1 border-t">
        <button
          disabled
          title="تصدير PDF قادم في المرحلة الرابعة"
          className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed opacity-60 hover:opacity-60"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          تصدير PDF
          <span className="text-[9px] bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">المرحلة 4</span>
        </button>
      </div>

    </div>
  )
}

// ── Visit card ────────────────────────────────────────────────────────────────

function VisitCard({ record }: { record: VisitRecordDetail }) {
  const [expanded, setExpanded] = useState(false)

  const displayDate = formatDate(record.appointment.scheduledAt)
  const diagnosis = record.diagnosis ?? "لم يسجَّل تشخيص"

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Timeline dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{diagnosis}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{displayDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PaymentBadge status={record.appointment.paymentStatus} />
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          <ExpandedVisitContent record={record} />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface VisitHistoryTabProps {
  records: VisitRecordDetail[]
  onNewVisit: () => void
}

export function VisitHistoryTab({ records, onNewVisit }: VisitHistoryTabProps) {
  return (
    <div className="p-4 space-y-4 max-w-2xl" dir="rtl">

      {/* Header with New Visit button */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">
          {records.length > 0
            ? `${records.length} زيارة مسجلة`
            : "لا توجد زيارات مسجلة"}
        </h2>
        <button
          onClick={onNewVisit}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          زيارة جديدة
        </button>
      </div>

      {/* Timeline */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">لا توجد زيارات بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ بتسجيل أول زيارة للمريض</p>
          </div>
        </div>
      ) : (
        <div className="relative space-y-3">
          {/* Vertical timeline line */}
          <div className="absolute right-[17px] top-4 bottom-4 w-px bg-border" aria-hidden />
          {records.map((record) => (
            <VisitCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}
