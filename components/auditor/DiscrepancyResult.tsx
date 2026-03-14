"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Banknote, Smartphone, CreditCard, Shield } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { AuditorDiscrepancyData, AuditorSectionResult } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStatus(pct: number | null): "green" | "amber" | "red" {
  if (pct === null || pct < 5) return "green"
  if (pct <= 15) return "amber"
  return "red"
}

const STATUS_CONFIG = {
  green: {
    label: "مطابقة جيدة",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
    badgeClass: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  },
  amber: {
    label: "فارق طفيف",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700",
    dotClass: "bg-amber-500",
  },
  red: {
    label: "فارق ملحوظ",
    textClass: "text-red-700",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
    badgeClass: "bg-red-100 text-red-700",
    dotClass: "bg-red-500",
  },
}

// Neutral helper text per method — appears only for amber/red
const HELPER_TEXTS: Record<string, string[]> = {
  cash: [
    "قد يعكس هذا مرضى حضروا دون تسجيل مسبق في النظام.",
    "قد يعكس هذا إعفاءً من الرسوم لم يُسجَّل في الزيارة.",
  ],
  instapay: [
    "قد يعكس هذا فارقاً زمنياً في تسوية مدفوعات إنستاباي.",
  ],
  fawry: [
    "قد يعكس هذا فارقاً زمنياً في تسوية مدفوعات فوري.",
  ],
  insurance: [
    "قد يعكس هذا مطالبة تأمين لم تُعالَج أو تُسوَّ بعد.",
  ],
}

const METHOD_LABELS: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  cash:      { label: "نقدي",      Icon: Banknote    },
  instapay:  { label: "إنستاباي", Icon: Smartphone  },
  fawry:     { label: "فوري",      Icon: CreditCard  },
  insurance: { label: "تأمين",     Icon: Shield      },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "—"
  return n.toLocaleString("en-US")
}

function SectionRow({
  methodKey,
  section,
  defaultOpen = false,
}: {
  methodKey: string
  section: AuditorSectionResult
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const status = getStatus(section.pct)
  const cfg = STATUS_CONFIG[status]
  const { label, Icon } = METHOD_LABELS[methodKey]

  const isZeroExpected = section.expected === 0

  return (
    <div className={`rounded-lg border ${cfg.borderClass} overflow-hidden`}>
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-right ${cfg.bgClass} hover:brightness-95 transition-all`}
        aria-expanded={open}
      >
        <Icon className={`h-4 w-4 shrink-0 ${cfg.textClass}`} />
        <span className="flex-1 text-sm font-medium">{label}</span>
        {isZeroExpected ? (
          <span className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
            لا توجد بيانات
          </span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}>
            {section.pct === null ? "٠٪" : `${section.pct.toFixed(1)}٪`}
          </span>
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t px-4 py-3 space-y-2 bg-card">
          {isZeroExpected ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              لا توجد تحصيلات متوقعة لهذه الوسيلة اليوم.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">المتوقع</p>
                  <p className="font-semibold tabular-nums">{fmt(section.expected)} ج.م</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">المُبلَّغ عنه</p>
                  <p className="font-semibold tabular-nums">{fmt(section.reported)} ج.م</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">الفارق</p>
                  <p className={`font-semibold tabular-nums ${section.diff !== 0 ? cfg.textClass : "text-foreground"}`}>
                    <span>{section.diff >= 0 ? "+" : "-"}</span>{fmt(Math.abs(section.diff))} ج.م
                  </p>
                </div>
              </div>
              {/* Helper text for amber/red */}
              {(status === "amber" || status === "red") && HELPER_TEXTS[methodKey] && (
                <div className={`rounded-md ${cfg.bgClass} px-3 py-2 mt-1`}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    ما الذي قد يفسر هذا؟
                  </p>
                  <ul className="space-y-0.5">
                    {HELPER_TEXTS[methodKey].map((text, i) => (
                      <li key={i} className={`text-xs ${cfg.textClass}`}>
                        • {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  result: AuditorDiscrepancyData
}

export default function DiscrepancyResult({ result }: Props) {
  const { overall, cash, instapay, fawry, insurance } = result
  const overallStatus = getStatus(overall.pct)
  const cfg = STATUS_CONFIG[overallStatus]

  // Collect helper texts for methods that are amber or red
  const activeHelpers: { method: string; texts: string[] }[] = []
  for (const [key, section] of Object.entries({ cash, instapay, fawry, insurance })) {
    const s = getStatus(section.pct)
    if ((s === "amber" || s === "red") && section.expected > 0 && HELPER_TEXTS[key]) {
      activeHelpers.push({ method: key, texts: HELPER_TEXTS[key] })
    }
  }

  const isZeroExpected = overall.expected === 0

  return (
    <div className="space-y-4">
      {/* ── Overall combined result ─────────────────────────────── */}
      <Card className={`border ${cfg.borderClass} ${cfg.bgClass}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">نتيجة مطابقة الإيرادات</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${cfg.badgeClass}`}>
              {cfg.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Insurance exclusion notice */}
          <p className="mb-3 text-xs text-muted-foreground">
            * مدفوعات التأمين مستبعدة من هذا الإجمالي
          </p>

          {isZeroExpected ? (
            <p className="text-sm text-muted-foreground">
              لا توجد تحصيلات متوقعة لهذه الفترة.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-6">
              {/* Big discrepancy % */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي نسبة الفارق</p>
                <p className={`text-4xl font-bold tabular-nums ${cfg.textClass}`}>
                  {overall.pct === null ? "—" : `${overall.pct.toFixed(1)}٪`}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">إجمالي متوقع: </span>
                    <span className="font-semibold tabular-nums">{fmt(overall.expected)} ج.م</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">إجمالي مُبلَّغ: </span>
                    <span className="font-semibold tabular-nums">{fmt(overall.reported)} ج.م</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">الفارق: </span>
                  <span className={`font-semibold tabular-nums ${overall.diff !== 0 ? cfg.textClass : ""}`}>
                    <span>{overall.diff >= 0 ? "+" : "-"}</span>{fmt(Math.abs(overall.diff))} ج.م
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Helper text — amber or red only ──────────────────── */}
          {!isZeroExpected && activeHelpers.length > 0 && (
            <div className={`mt-4 rounded-lg border ${cfg.borderClass} px-4 py-3`}>
              <p className={`text-sm font-medium ${cfg.textClass} mb-2`}>
                ما الذي قد يفسر هذا الفارق؟
              </p>
              <ul className="space-y-1">
                {activeHelpers.flatMap(({ texts }) =>
                  texts.map((text, i) => (
                    <li key={i} className={`text-sm ${cfg.textClass}`}>
                      • {text}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Per-section breakdown — collapsed by default ────────── */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          تفاصيل كل وسيلة دفع
        </h3>
        <div className="space-y-2">
          <SectionRow methodKey="cash"      section={cash}      />
          <SectionRow methodKey="instapay"  section={instapay}  />
          <SectionRow methodKey="fawry"     section={fawry}     />
          <SectionRow methodKey="insurance" section={insurance} />
        </div>
      </div>
    </div>
  )
}
