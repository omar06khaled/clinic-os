"use client"

import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { RevenueRow } from "@/app/api/financials/revenue/route"

export type FilterChip = "all" | "unpaid" | "paid" | "waived"

interface Props {
  rows: RevenueRow[]
  filter: FilterChip
  onFilterChange: (f: FilterChip) => void
  defaultFee: number
  onMarkAsPaid: (row: RevenueRow) => void
  onViewInvoice: (row: RevenueRow) => void
}

const FILTER_KEYS: { key: FilterChip; tKey: string }[] = [
  { key: "all",    tKey: "filterAll"    },
  { key: "unpaid", tKey: "filterUnpaid" },
  { key: "paid",   tKey: "filterPaid"   },
  { key: "waived", tKey: "filterWaived" },
]

const METHOD_TKEYS: Record<string, string> = {
  cash:      "methodCash",
  instapay:  "methodInstapay",
  fawry:     "methodFawry",
  insurance: "methodInsurance",
}

const STATUS_TKEYS: Record<string, string> = {
  paid:    "statusPaid",
  pending: "statusUnpaid",
  waived:  "statusWaived",
}

// Distinct color per payment method
const METHOD_BADGE_CLASSES: Record<string, string> = {
  cash:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  instapay:  "bg-blue-100 text-blue-700 border border-blue-200",
  fawry:     "bg-orange-100 text-orange-700 border border-orange-200",
  insurance: "bg-purple-100 text-purple-700 border border-purple-200",
}

const STATUS_COLORS: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  waived:  "bg-slate-100 text-slate-600",
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
  onViewInvoice,
}: Props) {
  const t = useTranslations("financials")

  const filtered = rows.filter((r) => {
    if (filter === "all") return true
    if (filter === "unpaid") return r.paymentStatus === "pending"
    if (filter === "paid") return r.paymentStatus === "paid"
    if (filter === "waived") return r.paymentStatus === "waived"
    return true
  })

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_KEYS.map(({ key, tKey }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t(tKey)}
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
          {t("noRecords")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-start">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colPatient")}
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colDate")}
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colAmount")}
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colPaymentMethod")}
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colBookingFee")}
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  {t("colStatus")}
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
                      {displayAmount.toLocaleString("ar-EG")} {t("currencySuffix")}
                    </td>
                    <td className="px-4 py-3">
                      {row.paymentMethod ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            METHOD_BADGE_CLASSES[row.paymentMethod] ??
                            "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {t(METHOD_TKEYS[row.paymentMethod] ?? "methodCash")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.convenienceFee > 0 ? (
                        <span className="font-medium text-amber-600">
                          {row.convenienceFee} {t("currencySuffix")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t("zeroAmount")} {t("currencySuffix")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[row.paymentStatus] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t(STATUS_TKEYS[row.paymentStatus] ?? "statusUnpaid")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {row.paymentStatus === "pending" &&
                          (row.status === "arrived" || row.status === "scheduled") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => onMarkAsPaid(row)}
                            >
                              {t("recordPaymentBtn")}
                            </Button>
                          )}
                        {row.paymentStatus === "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title={t("viewInvoiceTitle")}
                            onClick={() => onViewInvoice(row)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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
