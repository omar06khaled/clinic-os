"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { VisitRecordDetail, ConditionDetail } from "@/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Cairo",
  })
}

function parseBP(bp: string | null): { systolic: number; diastolic: number } | null {
  if (!bp) return null
  const parts = bp.split("/")
  if (parts.length !== 2) return null
  const s = parseInt(parts[0])
  const d = parseInt(parts[1])
  if (isNaN(s) || isNaN(d)) return null
  return { systolic: s, diastolic: d }
}

function parseHba1c(doctorNotes: string | null): number | null {
  if (!doctorNotes) return null
  const match = doctorNotes.match(/HbA1c\s+([\d.]+)%/i)
  return match ? parseFloat(match[1]) : null
}

// ── Empty chart message ───────────────────────────────────────────────────────

function ChartEmptyMessage({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted-foreground text-center px-4">{message}</p>
    </div>
  )
}

// ── Chart wrapper ─────────────────────────────────────────────────────────────

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

// ── Diabetes charts ───────────────────────────────────────────────────────────

function DiabetesCharts({ records }: { records: VisitRecordDetail[] }) {
  // Records arrive DESC → reverse for chronological chart order
  const chronological = [...records].reverse()

  // Weight data
  const weightData = chronological
    .filter((r) => r.vitalsWeight !== null)
    .map((r) => ({
      date: formatDateShort(r.appointment.scheduledAt),
      weight: r.vitalsWeight as number,
    }))

  // HbA1c data (parsed from doctorNotes)
  const hba1cData = chronological
    .map((r) => {
      const value = parseHba1c(r.doctorNotes)
      return value !== null
        ? { date: formatDateShort(r.appointment.scheduledAt), hba1c: value }
        : null
    })
    .filter((d): d is { date: string; hba1c: number } => d !== null)

  return (
    <>
      {/* HbA1c chart */}
      <ChartSection title="HbA1c عبر الزيارات">
        {hba1cData.length < 2 ? (
          <ChartEmptyMessage message="ستظهر قيم HbA1c هنا عند إضافة سجلات الزيارات — استخرجها من ملاحظات الطبيب" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hba1cData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => [`${v ?? ""}%`, "HbA1c"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="hba1c"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4, fill: "#f59e0b" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {/* Weight chart */}
      <ChartSection title="الوزن عبر الزيارات (كجم)">
        {weightData.length < 2 ? (
          <ChartEmptyMessage message="أضف سجلات زيارات أكثر لرؤية منحنى الوزن" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                formatter={(v) => [`${v ?? ""} كجم`, "الوزن"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartSection>
    </>
  )
}

// ── Hypertension chart ────────────────────────────────────────────────────────

function HypertensionChart({ records }: { records: VisitRecordDetail[] }) {
  const chronological = [...records].reverse()

  const bpData = chronological
    .map((r) => {
      const bp = parseBP(r.vitalsBP)
      return bp
        ? {
            date: formatDateShort(r.appointment.scheduledAt),
            systolic: bp.systolic,
            diastolic: bp.diastolic,
          }
        : null
    })
    .filter((d): d is { date: string; systolic: number; diastolic: number } => d !== null)

  return (
    <ChartSection title="ضغط الدم عبر الزيارات (mmHg)">
      {bpData.length < 2 ? (
        <ChartEmptyMessage message="أضف سجلات زيارات أكثر لرؤية منحنى ضغط الدم" />
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs mb-1" dir="rtl">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-red-500 inline-block" />
              <span>الانقباضي (Systolic)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-blue-500 inline-block" />
              <span>الانبساطي (Diastolic)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                formatter={(v, name) => [
                  `${v ?? ""} mmHg`,
                  name === "systolic" ? "الانقباضي" : "الانبساطي",
                ]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4, fill: "#ef4444" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </ChartSection>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChronicTrackingTabProps {
  records: VisitRecordDetail[]
  conditions: ConditionDetail[]
}

export function ChronicTrackingTab({ records, conditions }: ChronicTrackingTabProps) {
  const hasDiabetes = conditions.some((c) => c.type === "diabetes")
  const hasHypertension = conditions.some((c) => c.type === "hypertension")
  const hasCardiac = conditions.some((c) => c.type === "cardiac")

  return (
    <div className="p-4 space-y-8 max-w-2xl" dir="rtl">
      <p className="text-sm text-muted-foreground">
        الرسوم البيانية تعرض قيم العلامات الحيوية عبر الزيارات المسجلة.
      </p>

      {/* Diabetes section */}
      {hasDiabetes && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
            متابعة السكري
          </h3>
          <DiabetesCharts records={records} />
        </div>
      )}

      {/* Hypertension section */}
      {hasHypertension && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
            متابعة ضغط الدم
          </h3>
          <HypertensionChart records={records} />
        </div>
      )}

      {/* Cardiac — show BP chart as proxy for cardiac monitoring */}
      {hasCardiac && !hasHypertension && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
            متابعة القلب — ضغط الدم
          </h3>
          <HypertensionChart records={records} />
        </div>
      )}

      {/* Weight for cardiac patients with diabetes too */}
      {hasCardiac && hasDiabetes && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
            متابعة القلب
          </h3>
          <HypertensionChart records={records} />
        </div>
      )}
    </div>
  )
}
