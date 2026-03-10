"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RevenueRow } from "@/app/api/financials/revenue/route"

export type FilterChip = "all" | "unpaid" | "paid" | "waived"

interface Props {
  rows: RevenueRow[]
  filter: FilterChip
  onFilterChange: (f: FilterChip) => void
  defaultFee: number
  onMarkAsPaid: (row: RevenueRow) => void
}

const FILTER_LABELS: { key: FilterChip; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "unpaid", label: "غير مدفوع" },
  { key: "paid", label: "مدفوع" },
  { key: "waived", label: "معفى" },
]

const METHOD_LABELS: Record<string, string> = {
  cash: "كاش",
  instapay: "إنستاباي",
  fawry: "فوري",
  insurance: "تأمين",
}

const STATUS_LABELS: Record<string, string> = {
  paid: "مدفوع",
  pending: "غير مدفوع",
  waived: "معفى",
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  waived: "bg-slate-100 text-slate-600",
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function RevenueList({
  rows,
  filter,
  onFilterChange,
  defaultFee,
  onMarkAsPaid,
}: Props) {
  const filtered = rows.filter((r) => {
    if (filter === "all") return true
    if (filter === "unpaid") return r.paymentStatus === "pending"
    if (filter === "paid") return r.paymentStatus === "paid"
    if (filter === "waived") return r.paymentStatus === "waived"
    return true
  })

  return (
    <div dir="rtl" className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="mr-1 opacity-70">
                ({rows.filter((r) => {
                  if (key === "unpaid") return r.paymentStatus === "pending"
                  if (key === "paid") return r.paymentStatus === "paid"
                  if (key === "waived") return r.paymentStatus === "waived"
                  return false
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          لا توجد سجلات في هذه الفترة
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-right">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  المريض
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  التاريخ
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  المبلغ
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  طريقة الدفع
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  رسوم الحجز
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  الحالة
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const displayAmount =
                  row.paymentStatus === "paid"
                    ? row.amountPaid ?? 0
                    : defaultFee
                return (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{row.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="block">{formatDate(row.scheduledAt)}</span>
                      <span className="text-xs">{formatTime(row.scheduledAt)}</span>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {displayAmount.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="px-4 py-3">
                      {row.paymentMethod ? (
                        <Badge variant="outline" className="text-xs">
                          {METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.convenienceFee > 0 ? (
                        <span className="font-medium text-amber-600">
                          {row.convenienceFee} ج.م
                        </span>
                      ) : (
                        <span className="text-muted-foreground">٠ ج.م</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[row.paymentStatus] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[row.paymentStatus] ?? row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.paymentStatus === "pending" &&
                        (row.status === "arrived" || row.status === "scheduled") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onMarkAsPaid(row)}
                          >
                            تسجيل دفع
                          </Button>
                        )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
